const express = require("express");
const crypto = require("crypto");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { sendOtp } = require("../services/messaging");
const authenticateToken = require("../middleware/auth");
const authenticateGuest = require("../middleware/authenticateGuest");

const router = express.Router();
const phoneSchema = z.string().trim().regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +919876543210.");
const sendSchema = z.object({
  accountType: z.enum(["GUEST", "OWNER"]),
  phoneNumber: phoneSchema,
});
const verifySchema = sendSchema.extend({ code: z.string().regex(/^\d{6}$/) });
const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_HOURLY_SENDS = 5;
const MAX_ATTEMPTS = 5;

function hashOtp(otp) {
  return crypto.createHmac("sha256", process.env.JWT_SECRET).update(otp).digest("hex");
}
function safeEqualHex(a, b) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
async function findAccount(accountType, phoneNumber) {
  if (accountType === "OWNER") return prisma.owner.findUnique({ where: { phoneNumber } });
  return prisma.guestUser.findUnique({ where: { phoneNumber } });
}
async function sendForAccount(accountType, accountId, phoneNumber) {
  const now = new Date();
  const recent = await prisma.mobileOtp.findMany({
    where: { phoneNumber, createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    take: MAX_HOURLY_SENDS,
  });
  if (recent.length >= MAX_HOURLY_SENDS) {
    const oldestAllowed = recent[recent.length - 1];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestAllowed.createdAt.getTime() + 60 * 60 * 1000 - now.getTime()) / 1000));
    const error = new Error("Too many verification codes requested. Please try again later.");
    error.status = 429;
    error.retryAfterSeconds = retryAfterSeconds;
    throw error;
  }
  const latest = recent[0];
  if (latest && now.getTime() - latest.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const error = new Error("Please wait before requesting another verification code.");
    error.status = 429;
    error.retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now.getTime() - latest.lastSentAt.getTime())) / 1000);
    throw error;
  }

  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  await prisma.mobileOtp.create({
    data: {
      accountType,
      accountId,
      phoneNumber,
      otpHash: hashOtp(otp),
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      lastSentAt: now,
    },
  });
  const delivery = await sendOtp(phoneNumber, otp);
  if (!delivery.some((item) => item.ok)) {
    const error = new Error("ROOMO could not send the verification code. Check messaging configuration and try again.");
    error.status = 503;
    throw error;
  }
  return { channels: delivery.filter((item) => item.ok).map((item) => item.channel), expiresInSeconds: OTP_TTL_MS / 1000 };
}

// POST /api/mobile-verification/send — resend OTP for an existing account/phone.
router.post("/send", async (req, res, next) => {
  try {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Provide accountType and a phone number in international format." });
    const account = await findAccount(parsed.data.accountType, parsed.data.phoneNumber);
    // Generic response prevents exposing whether a phone number belongs to an account.
    if (!account) return res.json({ message: "If the account exists, a verification code will be sent." });
    if (account.phoneVerified) return res.status(409).json({ message: "This mobile number is already verified." });
    const result = await sendForAccount(parsed.data.accountType, account.id, parsed.data.phoneNumber);
    return res.json({ message: "Verification code requested.", ...result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message, retryAfterSeconds: error.retryAfterSeconds });
    next(error);
  }
});

// POST /api/mobile-verification/verify — verifies an OTP and activates the phone number.
router.post("/verify", async (req, res, next) => {
  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Provide a valid phone number, account type, and six-digit code." });
    const account = await findAccount(parsed.data.accountType, parsed.data.phoneNumber);
    if (!account) return res.status(400).json({ message: "The code is invalid or expired." });
    if (account.phoneVerified) return res.json({ message: "This mobile number is already verified." });

    const challenge = await prisma.mobileOtp.findFirst({
      where: {
        accountType: parsed.data.accountType,
        accountId: account.id,
        phoneNumber: parsed.data.phoneNumber,
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });
    if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= MAX_ATTEMPTS) {
      return res.status(400).json({ message: "The code is invalid or expired. Request a new code." });
    }
    const expected = hashOtp(parsed.data.code);
    if (!safeEqualHex(challenge.otpHash, expected)) {
      await prisma.mobileOtp.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
      return res.status(400).json({ message: "The code is incorrect or expired." });
    }

    await prisma.$transaction([
      prisma.mobileOtp.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } }),
      parsed.data.accountType === "OWNER"
        ? prisma.owner.update({ where: { id: account.id }, data: { phoneVerified: true, phoneVerifiedAt: new Date() } })
        : prisma.guestUser.update({ where: { id: account.id }, data: { phoneVerified: true, phoneVerifiedAt: new Date() } }),
    ]);
    return res.json({ message: "Mobile number verified successfully.", accountType: parsed.data.accountType });
  } catch (error) { next(error); }
});

// Authenticated accounts can attach a mobile number if they registered before phone verification was added.
router.post("/send-current", async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Sign in before adding a mobile number." });
  try {
    const jwt = require("jsonwebtoken");
    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
    catch { return res.status(401).json({ message: "Your session is invalid or expired." }); }

    const parsed = z.object({ phoneNumber: phoneSchema }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Use international phone format, e.g. +919876543210." });
    const isGuest = decoded.role === "GUEST" || decoded.aud === "roomo-guest";
    const accountType = isGuest ? "GUEST" : "OWNER";
    const account = isGuest
      ? await prisma.guestUser.findUnique({ where: { id: decoded.sub } })
      : await prisma.owner.findUnique({ where: { id: decoded.sub } });
    if (!account) return res.status(401).json({ message: "Account not found." });
    const existingPhone = await findAccount(accountType, parsed.data.phoneNumber);
    if (existingPhone && existingPhone.id !== account.id) return res.status(409).json({ message: "That mobile number is already linked to another account." });

    const updated = accountType === "GUEST"
      ? await prisma.guestUser.update({ where: { id: account.id }, data: { phoneNumber: parsed.data.phoneNumber, phoneVerified: false, phoneVerifiedAt: null } })
      : await prisma.owner.update({ where: { id: account.id }, data: { phoneNumber: parsed.data.phoneNumber, phoneVerified: false, phoneVerifiedAt: null } });
    const result = await sendForAccount(accountType, updated.id, updated.phoneNumber);
    return res.json({ message: "Verification code requested.", ...result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message, retryAfterSeconds: error.retryAfterSeconds });
    next(error);
  }
});

module.exports = router;
