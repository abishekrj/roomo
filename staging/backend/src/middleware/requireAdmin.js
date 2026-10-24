
const prisma = require("../lib/prisma");

async function requireAdmin(req, res, next) {
  try {
    // The authentication middleware must run before this middleware.
    const ownerId = req.owner?.sub;

    if (!ownerId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    // Read the current role from the database instead of trusting
    // a role supplied by the browser or stored in a JWT.
    const account = await prisma.owner.findUnique({
      where: { id: ownerId },
      select: { id: true, role: true },
    });

    if (!account) {
      return res.status(401).json({
        message: "Account not found.",
      });
    }

    if (account.role !== "ADMIN") {
      return res.status(403).json({
        message: "Administrator access required.",
      });
    }

    req.admin = account;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = requireAdmin;
