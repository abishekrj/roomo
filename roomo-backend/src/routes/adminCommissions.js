const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();
router.use(authenticateToken, requireAdmin);

router.get("/owners", async (_req, res, next) => {
  try {
    const owners = await prisma.owner.findMany({
      where: { role: "OWNER" },
      select: { id: true, fullName: true, email: true, phoneNumber: true, phoneVerified: true, commissionRate: true },
      orderBy: { fullName: "asc" },
    });
    return res.json({ owners });
  } catch (error) { next(error); }
});

router.get("/", async (_req, res, next) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { status: { in: ["REQUESTED", "CONFIRMED"] } },
      include: {
        guest: { select: { fullName: true, email: true, phoneNumber: true, phoneVerified: true } },
        property: { include: { owner: { select: { id: true, fullName: true, email: true, phoneNumber: true, phoneVerified: true, commissionRate: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    const totals = reservations.reduce((acc, item) => {
      acc.bookingValue += Number(item.totalAmount);
      acc.commissionDue += item.commissionStatus === "PAID" ? 0 : Number(item.commissionAmount);
      acc.commissionPaid += item.commissionStatus === "PAID" ? Number(item.commissionAmount) : 0;
      return acc;
    }, { bookingValue: 0, commissionDue: 0, commissionPaid: 0 });
    return res.json({
      totals: Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Math.round(value * 100) / 100])),
      reservations,
    });
  } catch (error) { next(error); }
});

router.patch("/owners/:id/rate", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const body = z.object({ commissionRate: z.coerce.number().min(0).max(50).finite() }).safeParse(req.body);
  if (!id.success || !body.success) return res.status(400).json({ message: "Provide a valid owner ID and a commission rate from 0 to 50 percent." });
  try {
    const owner = await prisma.owner.update({
      where: { id: id.data },
      data: { commissionRate: body.data.commissionRate.toFixed(2) },
      select: { id: true, fullName: true, email: true, commissionRate: true },
    });
    return res.json({ message: "Owner commission rate updated. Existing reservations keep their saved rate.", owner });
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Owner not found." });
    next(error);
  }
});

router.patch("/reservations/:id/payment", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const body = z.object({
    commissionStatus: z.enum(["DUE", "PAID", "WAIVED"]),
    commissionNotes: z.string().trim().max(2000).optional().nullable(),
  }).safeParse(req.body);
  if (!id.success || !body.success) return res.status(400).json({ message: "Provide a valid reservation and commission payment status." });
  try {
    const reservation = await prisma.reservation.update({
      where: { id: id.data },
      data: {
        commissionStatus: body.data.commissionStatus,
        commissionPaidAt: body.data.commissionStatus === "PAID" ? new Date() : null,
        commissionNotes: body.data.commissionNotes || null,
      },
      select: { id: true, reservationCode: true, commissionAmount: true, commissionStatus: true, commissionPaidAt: true, commissionNotes: true },
    });
    return res.json({ message: "Commission record updated.", reservation });
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Reservation not found." });
    next(error);
  }
});


router.get("/notifications", async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const notifications = await prisma.notificationLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, reservationId: true, channel: true, recipientType: true,
        recipientPhone: true, messageType: true, status: true,
        providerMessageId: true, errorMessage: true, sentAt: true, createdAt: true,
      },
    });
    res.json({ notifications });
  } catch (error) { next(error); }
});

module.exports = router;
