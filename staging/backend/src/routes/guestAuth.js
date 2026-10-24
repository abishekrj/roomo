const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const { z } = require("zod");
const prisma = require("../lib/prisma");

const router = express.Router();
const googleClient = new OAuth2Client();
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phoneNumber: z.string().trim().regex(/^\+[1-9]\d{7,14}$/).optional().or(z.literal("")),
  password: z.string().min(12).max(72),
});
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});
const emailSchema = z.object({ email: z.string().trim().email().max(254) });
const verifySchema = z.object({ token: z.string().min(32).max(200) });
const googleSchema = z.object({ credential: z.string().min(20).max(10000) });

function createGuestToken(user) {
  return jwt.sign(
    { sub: user.id, role: "GUEST" },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
      issuer: "roomo-api",
      audience: "roomo-guest",
    }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    authProvider: user.authProvider,
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt,
  };
}

function emailIsConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.EMAIL_FROM &&
    process.env.CLIENT_URL
  );
}

function createVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
  };
}

async function sendVerificationEmail(user, token) {
  if (!emailIsConfigured()) {
    const error = new Error("Email delivery is not configured. Please configure SMTP settings in the backend .env file.");
    error.status = 503;
    throw error;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const verifyUrl = new URL("/roomo-verify-email.html", process.env.CLIENT_URL);
  verifyUrl.searchParams.set("token", token);
  const safeName = String(user.fullName || "there")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Verify your ROOMO email address",
    text: `Hello ${user.fullName || "there"},\n\nPlease verify your ROOMO email address by opening this link (valid for 24 hours):\n${verifyUrl.toString()}\n\nIf you did not create a ROOMO account, you can ignore this email.`,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#24364b;line-height:1.6"><h2>Welcome to ROOMO</h2><p>Hello ${safeName},</p><p>Please confirm this email address to activate your ROOMO guest account.</p><p><a href="${verifyUrl.toString()}" style="display:inline-block;background:#2878c8;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">Verify Email</a></p><p>This link expires in 24 hours and can only be used once.</p><p>If you did not create a ROOMO account, you can ignore this email.</p></body></html>`,
  });
}

async function issueVerificationEmail(user) {
  const verification = createVerificationToken();
  await prisma.guestUser.update({
    where: { id: user.id },
    data: {
      emailVerificationTokenHash: verification.tokenHash,
      emailVerificationExpiresAt: verification.expiresAt,
    },
  });
  await sendVerificationEmail(user, verification.token);
}

router.get("/config", (_req, res) => {
  res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || null });
});

router.post("/register", async (req, res, next) => {
  try {
    const verificationEmailConfigured = emailIsConfigured();
    // Unverified accounts are allowed only when a developer explicitly opts in locally.
    const allowUnverifiedLocalGuests =
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_UNVERIFIED_LOCAL_GUESTS === "true";
    if (!verificationEmailConfigured && !allowUnverifiedLocalGuests) {
      return res.status(503).json({
        message: "Email verification is not configured yet. Please configure SMTP or contact the ROOMO team.",
      });
    }

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Please check your registration details.",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.guestUser.create({
      data: {
        fullName: parsed.data.fullName,
        email,
        phoneNumber: parsed.data.phoneNumber || null,
        phoneVerified: false,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        authProvider: "EMAIL",
        emailVerified: allowUnverifiedLocalGuests && !verificationEmailConfigured,
      },
    });

    if (verificationEmailConfigured) {
      try {
        await issueVerificationEmail(user);
      } catch (emailError) {
        console.error("ROOMO verification email could not be sent:", emailError.message);
        return res.status(503).json({
          message: "Your account was created but the verification email could not be sent. Please configure SMTP or contact the ROOMO team.",
          code: "VERIFICATION_EMAIL_FAILED",
        });
      }
    }

    return res.status(201).json({
      message: verificationEmailConfigured
        ? "Account created. Check your inbox and click the verification link before signing in."
        : "Account created for local development. Email verification is disabled only for this local environment.",
      email: user.email,
      verificationRequired: !allowUnverifiedLocalGuests,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "An account with this email already exists. Please sign in instead." });
    }
    next(error);
  }
});

router.post("/verify-email", async (req, res, next) => {
  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "This verification link is invalid or expired." });

    const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
    const user = await prisma.guestUser.findUnique({ where: { emailVerificationTokenHash: tokenHash } });
    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt <= new Date()) {
      return res.status(400).json({ message: "This verification link is invalid or expired. Request a new verification email and try again." });
    }

    await prisma.guestUser.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    });
    return res.json({ message: "Your email has been verified. You can now sign in." });
  } catch (error) { next(error); }
});

router.post("/resend-verification", async (req, res, next) => {
  try {
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please enter a valid email address." });
    if (!emailIsConfigured()) {
      return res.status(503).json({ message: "Email delivery is not configured yet. Please contact the ROOMO team." });
    }

    const user = await prisma.guestUser.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (user && user.passwordHash && !user.emailVerified) {
      try {
        await issueVerificationEmail(user);
      } catch (emailError) {
        console.error("ROOMO verification email could not be resent:", emailError.message);
        return res.status(503).json({ message: "The verification email could not be sent. Please try again later." });
      }
    }
    return res.json({ message: "If this email belongs to an unverified ROOMO account, a new verification link has been sent." });
  } catch (error) { next(error); }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please enter a valid email and password." });
    const user = await prisma.guestUser.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    const passwordMatches = user?.passwordHash ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
    if (!passwordMatches) {
      return res.status(401).json({ message: "Email or password is incorrect. If you registered with Google, please continue with Google." });
    }
    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before signing in. You can request a new verification link below.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }
    return res.json({ message: "Sign-in successful.", user: publicUser(user), token: createGuestToken(user) });
  } catch (error) { next(error); }
});

router.post("/google", async (req, res, next) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: "Google sign-in is not configured yet. Please use email and password." });
    const parsed = googleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "A valid Google credential is required." });
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: parsed.data.credential, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ message: "The Google credential is invalid or expired." });
    }
    if (!payload || !payload.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ message: "Google could not verify this account." });
    }

    const email = payload.email.toLowerCase();
    let user = await prisma.guestUser.findUnique({ where: { email } });
    if (user) {
      if (user.googleId && user.googleId !== payload.sub) {
        return res.status(409).json({ message: "This email is already linked to a different Google account." });
      }
      user = await prisma.guestUser.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          authProvider: user.passwordHash ? "EMAIL_GOOGLE" : "GOOGLE",
          fullName: user.fullName || payload.name || email,
          emailVerified: true,
          emailVerificationTokenHash: null,
          emailVerificationExpiresAt: null,
        },
      });
    } else {
      user = await prisma.guestUser.create({
        data: {
          fullName: (payload.name || email.split("@")[0]).slice(0, 100),
          email,
          googleId: payload.sub,
          authProvider: "GOOGLE",
          emailVerified: true,
        },
      });
    }
    return res.json({ message: "Signed in with Google successfully.", user: publicUser(user), token: createGuestToken(user) });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "An account already exists with this email. Please sign in using that account." });
    }
    next(error);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Authentication required." });
    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: "roomo-api", audience: "roomo-guest" }); }
    catch { return res.status(401).json({ message: "Invalid or expired guest session." }); }
    const user = await prisma.guestUser.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.emailVerified) return res.status(401).json({ message: "Guest account not found or email is not verified." });
    return res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

module.exports = router;
