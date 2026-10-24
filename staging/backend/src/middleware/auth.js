const jwt = require("jsonwebtoken");
const { ADMIN_COOKIE, parseCookies } = require("../lib/sessionCookies");
const prisma = require("../lib/prisma");

const TOKEN_ISSUER = "roomo-api";
const OWNER_ADMIN_AUDIENCE = "roomo-admin";

async function authenticateToken(req, res, next) {
  const cookies = parseCookies(req);
  const authorization = req.headers.authorization;
  // Cookie sessions are the primary authentication mechanism. Bearer support remains
  // temporarily for older clients during migration.
  const token = cookies[ADMIN_COOKIE] || (authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null);

  if (!token) return res.status(401).json({ message: "Authentication required." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: TOKEN_ISSUER,
      audience: OWNER_ADMIN_AUDIENCE,
      algorithms: ["HS256"],
    });
    if (!decoded || typeof decoded.sub !== "string" || !decoded.sub) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
    const owner = await prisma.owner.findUnique({ where: { id: decoded.sub }, select: { id: true, isActive: true } });
    if (!owner) return res.status(401).json({ message: "Account not found. Please sign in again." });
    if (owner.isActive === false) return res.status(403).json({ message: "This owner account has been disabled. Please contact ROOMO support." });
    req.owner = decoded;
    return next();
  } catch (error) {
    if (error?.name === "PrismaClientKnownRequestError" || error?.name === "PrismaClientInitializationError") return next(error);
    return res.status(401).json({ message: "Invalid or expired session. Please sign in again." });
  }
}

module.exports = authenticateToken;
