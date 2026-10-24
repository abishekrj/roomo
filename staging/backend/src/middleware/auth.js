const jwt = require("jsonwebtoken");

const TOKEN_ISSUER = "roomo-api";
const OWNER_ADMIN_AUDIENCE = "roomo-admin";

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    // Accept only owner/admin tokens issued for this API and audience.
    // Guest tokens use a separate audience and are validated by authenticateGuest.
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: TOKEN_ISSUER,
      audience: OWNER_ADMIN_AUDIENCE,
      algorithms: ["HS256"],
    });

    if (!decoded || typeof decoded.sub !== "string" || !decoded.sub) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    req.owner = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = authenticateToken;
