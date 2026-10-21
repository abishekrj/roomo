
require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const prisma = require("./lib/prisma");
const authRoutes = require("./routes/auth");
const guestAuthRoutes = require("./routes/guestAuth");
const adminRoutes = require("./routes/admin");
const adminHomepageRoutes = require("./routes/adminHomepage");
const adminTestimonialsRoutes = require("./routes/adminTestimonials");
const propertyRoutes = require("./routes/properties");
const reservationRoutes = require("./routes/reservations");
const favoriteRoutes = require("./routes/favorites");
const adminCommissionRoutes = require("./routes/adminCommissions");
const homepageRoutes = require("./routes/homepage");
const nearbyPlacesRoutes = require("./routes/nearbyPlaces");
const galleryRoutes = require("./routes/gallery");
const adminGalleryRoutes = require("./routes/adminGallery");
const roomFilterRoutes = require("./routes/roomFilters");
const adminRoomFilterRoutes = require("./routes/adminRoomFilters");
const listingDisplaySettingsRoutes = require("./routes/listingDisplaySettings");
const authenticateToken = require("./middleware/auth");

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  throw new Error("DATABASE_URL and JWT_SECRET must be configured.");
}

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
}));

app.use(express.json({ limit: "20kb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), { dotfiles: "deny", index: false, maxAge: "1d" }));

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
app.use("/api/guest-auth", authLimiter, guestAuthRoutes);

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
app.use("/api/homepage/nearby-places", nearbyPlacesRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/room-filters", roomFilterRoutes);
app.use("/api/listing-display-settings", listingDisplaySettingsRoutes);
app.use("/api/admin/room-filters", adminRoomFilterRoutes);
app.use("/api/admin/gallery", adminGalleryRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin/commissions", adminCommissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/homepage", adminHomepageRoutes);
app.use("/api/admin/testimonials", adminTestimonialsRoutes);

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
