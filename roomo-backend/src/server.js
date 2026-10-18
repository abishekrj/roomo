
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const prisma = require("./lib/prisma");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const adminHomepageRoutes = require("./routes/adminHomepage");
const propertyRoutes = require("./routes/properties");
const homepageRoutes = require("./routes/homepage");
const authenticateToken = require("./middleware/auth");

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  throw new Error("DATABASE_URL and JWT_SECRET must be configured.");
}

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
}));

app.use(express.json({ limit: "20kb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authLimiter, authRoutes);

app.get("/api/auth/me", authenticateToken, async (req, res, next) => {
  try {
    const owner = await prisma.owner.findUnique({
      where: { id: req.owner.sub },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    if (!owner) {
      return res.status(401).json({
        message: "Owner account not found.",
      });
    }

    res.json({ owner });
  } catch (error) {
    next(error);
  }
});

app.use("/api/homepage", homepageRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/homepage", adminHomepageRoutes);

app.use((error, req, res, next) => {
  console.error("API error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    message: "An unexpected server error occurred.",
  });
});

const port = Number(process.env.PORT) || 5001;

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Roomo API",
    status: "running",
    health: "/api/health"
  });
});

const server = app.listen(port, () => {
  console.log(`Roomo API running at http://localhost:${port}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
