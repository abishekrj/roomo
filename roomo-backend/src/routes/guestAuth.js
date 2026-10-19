const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { z } = require("zod");
const prisma = require("../lib/prisma");

const router = express.Router();
const googleClient = new OAuth2Client();

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(72),
});
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});
const googleSchema = z.object({ credential: z.string().min(20).max(10000) });

function createGuestToken(user) {
  return jwt.sign(
    { sub: user.id, role: "GUEST", audience: "roomo-guest" },
    process.env.JWT_SECRET,
    { expiresIn: "1h", issuer: "roomo-api" }
  );
}
function publicUser(user) {
  return { id: user.id, fullName: user.fullName, email: user.email, authProvider: user.authProvider, createdAt: user.createdAt };
}

router.get("/config", (_req, res) => {
  res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || null });
});

router.post("/register", async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please check your registration details.", errors: parsed.error.flatten().fieldErrors });
    const email = parsed.data.email.toLowerCase();
    const user = await prisma.guestUser.create({
      data: { fullName: parsed.data.fullName, email, passwordHash: await bcrypt.hash(parsed.data.password, 12), authProvider: "EMAIL" }
    });
    res.status(201).json({ message: "Your ROOMO guest account has been created.", user: publicUser(user), token: createGuestToken(user) });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "An account with this email already exists. Please sign in instead." });
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please enter a valid email and password." });
    const user = await prisma.guestUser.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    const passwordMatches = user?.passwordHash ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
    if (!passwordMatches) return res.status(401).json({ message: "Email or password is incorrect. If you registered with Google, please continue with Google." });
    res.json({ message: "Sign-in successful.", user: publicUser(user), token: createGuestToken(user) });
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
    if (!payload || !payload.sub || !payload.email || payload.email_verified !== true) return res.status(401).json({ message: "Google could not verify this account." });

    const email = payload.email.toLowerCase();
    let user = await prisma.guestUser.findUnique({ where: { email } });
    if (user) {
      if (user.googleId && user.googleId !== payload.sub) return res.status(409).json({ message: "This email is already linked to a different Google account." });
      user = await prisma.guestUser.update({
        where: { id: user.id },
        data: { googleId: payload.sub, authProvider: user.passwordHash ? "EMAIL_GOOGLE" : "GOOGLE", fullName: user.fullName || payload.name || email }
      });
    } else {
      user = await prisma.guestUser.create({
        data: { fullName: (payload.name || email.split("@")[0]).slice(0, 100), email, googleId: payload.sub, authProvider: "GOOGLE" }
      });
    }
    res.json({ message: "Signed in with Google successfully.", user: publicUser(user), token: createGuestToken(user) });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "An account already exists with this email. Please sign in using that account." });
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
    if (!user) return res.status(401).json({ message: "Guest account not found." });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

module.exports = router;
