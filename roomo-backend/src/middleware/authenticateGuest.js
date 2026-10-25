const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

async function authenticateGuest(req, res, next) {
  const authorization = req.headers.authorization;
  const cookieHeader = req.headers.cookie || "";
  const sessionCookie = cookieHeader.split(";").map(part => part.trim()).find(part => part.startsWith("roomo_guest_session="));
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : sessionCookie
      ? decodeURIComponent(sessionCookie.slice("roomo_guest_session=".length))
      : null;
  if (!token) return res.status(401).json({ message: "Sign in to continue with a reservation.", code: "GUEST_AUTH_REQUIRED" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "roomo-api",
      audience: "roomo-guest",
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
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticateGuest;
