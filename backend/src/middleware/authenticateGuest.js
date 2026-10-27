const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { GUEST_COOKIE, parseCookies } = require("../lib/sessionCookies");

async function authenticateGuest(req, res, next) {
  const cookies = parseCookies(req);
  const authorization = req.headers.authorization;
  const token = cookies[GUEST_COOKIE] || (authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null);
  if (!token) return res.status(401).json({ message: "Sign in to continue with a reservation.", code: "GUEST_AUTH_REQUIRED" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "roomo-api",
      audience: "roomo-guest",
      algorithms: ["HS256"],
    });
  } catch {
    return res.status(401).json({ message: "Your session is invalid or expired. Please sign in again.", code: "GUEST_SESSION_INVALID" });
  }

  if (decoded.role !== "GUEST" || !decoded.sub) {
    return res.status(403).json({ message: "A guest account is required to make a reservation." });
  }

  try {
    const guest = await prisma.guestUser.findUnique({
      where: { id: decoded.sub },
      select: { id: true, fullName: true, email: true, emailVerified: true, phoneNumber: true, phoneVerified: true },
    });
    if (!guest) return res.status(401).json({ message: "Guest account not found. Please sign in again." });
    if (!guest.emailVerified) return res.status(403).json({ message: "Verify your email before making a reservation.", code: "EMAIL_NOT_VERIFIED" });
    req.guest = guest;
    return next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticateGuest;
