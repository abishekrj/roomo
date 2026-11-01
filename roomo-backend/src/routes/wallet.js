const express = require("express");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

function driverAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : "";
  if (!token) return res.status(401).json({ message: "Driver sign-in required." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "roomo-api",
      audience: "roomo-driver",
    });
    if (decoded.type !== "DRIVER") return res.status(403).json({ message: "Driver access required." });
    req.driver = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Driver session expired. Please sign in again." });
  }
}

const money = (value) => Number(value || 0).toFixed(2);
const settingsDefaults = {
  commissionModel: "PERCENTAGE",
  commissionValue: 10,
  minimumBalance: 500,
  rechargeMethod: "BOTH",
  isEnabled: true,
};

async function getSettings(db = prisma) {
  return db.walletSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...settingsDefaults },
    update: {},
  });
}

async function refreshWalletStatus(tx, walletId, minimumBalance) {
  const wallet = await tx.driverWallet.findUnique({ where: { id: walletId } });
  if (!wallet || wallet.status === "RESTRICTED") return wallet;
  const status = Number(wallet.balance) >= Number(minimumBalance) ? "ACTIVE" : "LOW_BALANCE";
  return tx.driverWallet.update({ where: { id: walletId }, data: { status } });
}

router.get("/driver", driverAuth, async (req, res, next) => {
  try {
    const settings = await getSettings();
    const wallet = await prisma.driverWallet.upsert({
      where: { driverId: req.driver.sub },
      create: { driverId: req.driver.sub, balance: 0, status: "LOW_BALANCE" },
      update: {},
      include: {
        transactions: { orderBy: { createdAt: "desc" }, take: 30 },
        recharges: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    res.json({
      wallet: {
        ...wallet,
        balance: money(wallet.balance),
        totalRecharged: money(wallet.totalRecharged),
        totalCommission: money(wallet.totalCommission),
      },
      settings: {
        minimumBalance: money(settings.minimumBalance),
        rechargeMethod: settings.rechargeMethod,
        isEnabled: settings.isEnabled,
      },
      canAcceptBookings: wallet.status !== "RESTRICTED" && Number(wallet.balance) >= Number(settings.minimumBalance),
    });
  } catch (error) { next(error); }
});

const rechargeSchema = z.object({
  amount: z.coerce.number().positive().max(1000000),
  method: z.enum(["ONLINE", "MANUAL"]),
  remarks: z.string().trim().max(500).optional(),
});

router.post("/driver/recharges", driverAuth, async (req, res, next) => {
  try {
    const parsed = rechargeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a valid recharge amount and method." });
    const settings = await getSettings();
    if (!settings.isEnabled) return res.status(403).json({ message: "Driver wallet recharge is currently disabled." });
    if (settings.rechargeMethod !== "BOTH" && settings.rechargeMethod !== parsed.data.method) {
      return res.status(400).json({ message: "This recharge method is not currently enabled." });
    }
    const wallet = await prisma.driverWallet.upsert({
      where: { driverId: req.driver.sub },
      create: { driverId: req.driver.sub, balance: 0, status: "LOW_BALANCE" },
      update: {},
    });
    const recharge = await prisma.walletRecharge.create({
      data: {
        walletId: wallet.id,
        driverId: req.driver.sub,
        amount: parsed.data.amount.toFixed(2),
        method: parsed.data.method,
        status: "PENDING",
        remarks: parsed.data.remarks || null,
      },
    });
    res.status(201).json({
      message: parsed.data.method === "MANUAL"
        ? "Manual recharge request submitted. It will be credited after admin approval."
        : "Online recharge request created. Payment gateway verification is required before crediting the wallet.",
      recharge,
    });
  } catch (error) { next(error); }
});

const admin = express.Router();
admin.use(authenticateToken, requireAdmin);

admin.get("/settings", async (req, res, next) => {
  try { res.json({ settings: await getSettings() }); }
  catch (error) { next(error); }
});

const settingsSchema = z.object({
  commissionModel: z.enum(["PERCENTAGE", "FIXED"]),
  commissionValue: z.coerce.number().positive().max(999.99).refine(Number.isFinite),
  minimumBalance: z.coerce.number().nonnegative().max(1000000),
  rechargeMethod: z.enum(["ONLINE", "MANUAL", "BOTH"]),
  isEnabled: z.boolean(),
});

admin.patch("/settings", async (req, res, next) => {
  try {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please provide valid wallet settings.", errors: parsed.error.flatten().fieldErrors });
    if (parsed.data.commissionModel === "PERCENTAGE" && parsed.data.commissionValue > 100) return res.status(400).json({ message: "Percentage commission cannot exceed 100%." });
    const settings = await prisma.walletSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...parsed.data },
      update: parsed.data,
    });
    res.json({ message: "Wallet settings updated.", settings });
  } catch (error) { next(error); }
});

admin.get("/drivers", async (req, res, next) => {
  try {
    const drivers = await prisma.driver.findMany({
      select: {
        id: true, fullName: true, email: true, phoneNumber: true, isActive: true,
        wallet: { select: { id: true, balance: true, totalRecharged: true, totalCommission: true, status: true, updatedAt: true } },
      },
      orderBy: { fullName: "asc" },
    });
    res.json({ drivers });
  } catch (error) { next(error); }
});

admin.get("/recharges", async (req, res, next) => {
  try {
    const recharges = await prisma.walletRecharge.findMany({
      include: { driver: { select: { id: true, fullName: true, phoneNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ recharges });
  } catch (error) { next(error); }
});

admin.patch("/recharges/:id/approve", async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const recharge = await tx.walletRecharge.findUnique({ where: { id: req.params.id } });
      if (!recharge) return { error: "Recharge request not found.", status: 404 };
      if (recharge.status !== "PENDING") return { error: "This recharge request has already been processed.", status: 409 };
      if (recharge.method !== "MANUAL") return { error: "Online recharges must be credited through verified payment confirmation.", status: 400 };
      await tx.$queryRaw`SELECT id FROM driver_wallets WHERE id = ${recharge.walletId}::uuid FOR UPDATE`;
      const wallet = await tx.driverWallet.findUnique({ where: { id: recharge.walletId } });
      if (!wallet) return { error: "Driver wallet not found.", status: 404 };
      const before = Number(wallet.balance);
      const amount = Number(recharge.amount);
      const after = before + amount;
      const updated = await tx.walletRecharge.updateMany({
        where: { id: recharge.id, status: "PENDING" },
        data: { status: "SUCCESS", approvedBy: req.owner?.sub || "admin", completedAt: new Date() },
      });
      if (updated.count !== 1) return { error: "This recharge request has already been processed.", status: 409 };
      await tx.driverWallet.update({
        where: { id: wallet.id },
        data: { balance: after.toFixed(2), totalRecharged: { increment: amount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id, driverId: recharge.driverId, type: "CREDIT", category: "RECHARGE",
          amount: amount.toFixed(2), balanceBefore: before.toFixed(2), balanceAfter: after.toFixed(2),
          referenceId: "recharge:" + recharge.id, idempotencyKey: "recharge-credit:" + recharge.id,
          description: "Manual wallet recharge approved by admin",
          metadata: { rechargeId: recharge.id, approvedBy: req.owner?.sub || "admin" },
        },
      });
      const settings = await getSettings(tx);
      await refreshWalletStatus(tx, wallet.id, settings.minimumBalance);
      return { ok: true };
    });
    if (result.error) return res.status(result.status).json({ message: result.error });
    res.json({ message: "Manual recharge approved and wallet credited." });
  } catch (error) { next(error); }
});

admin.patch("/recharges/:id/reject", async (req, res, next) => {
  try {
    const updated = await prisma.walletRecharge.updateMany({
      where: { id: req.params.id, status: "PENDING", method: "MANUAL" },
      data: { status: "REJECTED", approvedBy: req.owner?.sub || "admin", remarks: String(req.body?.remarks || "Rejected by admin").slice(0, 1000), completedAt: new Date() },
    });
    if (!updated.count) return res.status(409).json({ message: "Recharge request not found or already processed." });
    res.json({ message: "Recharge request rejected." });
  } catch (error) { next(error); }
});

router.use("/admin", admin);
module.exports = router;
