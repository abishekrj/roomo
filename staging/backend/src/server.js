
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
const enquiryRoutes = require("./routes/enquiries");
const favoriteRoutes = require("./routes/favorites");
const adminCommissionRoutes = require("./routes/adminCommissions");
const homepageRoutes = require("./routes/homepage");
const visitorCountRoutes = require("./routes/visitorCount");
const nearbyPlacesRoutes = require("./routes/nearbyPlaces");
const shoppingDirectoryRoutes = require("./routes/shoppingDirectory");
const galleryRoutes = require("./routes/gallery");
const adminGalleryRoutes = require("./routes/adminGallery");
const roomFilterRoutes = require("./routes/roomFilters");
const adminRoomFilterRoutes = require("./routes/adminRoomFilters");
const adminRoomTypesRoutes = require("./routes/adminRoomTypes");
const ownerRoomTypesRoutes = require("./routes/ownerRoomTypes");
const listingDisplaySettingsRoutes = require("./routes/listingDisplaySettings");
const cmsPagesRoutes = require("./routes/cmsPages");
const adminCmsPagesRoutes = require("./routes/adminCmsPages");
const authenticateToken = require("./middleware/auth");
const { assertSecurityConfig } = require("./lib/securityConfig");

assertSecurityConfig(process.env);

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(cors({
  origin: process.env.CLIENT_URL || (process.env.NODE_ENV === "production" ? false : "http://localhost:5173"),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "20kb" }));
// Serve both the staging backend uploads and the legacy ROOMO uploads. Existing database URLs may reference files in either directory.
const stagingUploadsRoot = path.resolve(path.join(__dirname, "../uploads"));
const sharedUploadsRoot = path.resolve(process.env.ROOMO_UPLOAD_DIR || path.join(__dirname, "../../../roomo-backend/uploads"));
const uploadStaticOptions = { dotfiles: "deny", index: false, maxAge: "1d" };
app.use("/uploads", express.static(stagingUploadsRoot, uploadStaticOptions));
if (sharedUploadsRoot !== stagingUploadsRoot) app.use("/uploads", express.static(sharedUploadsRoot, uploadStaticOptions));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Limit public write endpoints separately from authentication to reduce spam and automated abuse.
const enquiryWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many enquiries from this connection. Please try again later." },
});
const reservationWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many reservation requests. Please try again later." },
});

app.post("/api/enquiries", enquiryWriteLimiter, (_req, _res, next) => next());
app.post("/api/reservations", reservationWriteLimiter, (_req, _res, next) => next());

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
        role: true,
        canEditProperties: true,
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

app.use("/api/homepage/visitor-count", visitorCountRoutes);
app.use("/api/homepage", homepageRoutes);
app.use("/api/homepage/nearby-places", nearbyPlacesRoutes);
app.use("/api/homepage/shops", shoppingDirectoryRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/room-filters", roomFilterRoutes);
app.use("/api/listing-display-settings", listingDisplaySettingsRoutes);
app.use("/api/cms-pages", cmsPagesRoutes);
app.use("/api/admin/cms-pages", adminCmsPagesRoutes);
app.use("/api/admin/room-filters", adminRoomFilterRoutes);
app.use("/api/admin/room-types", adminRoomTypesRoutes);
app.use("/api/room-types/owner", ownerRoomTypesRoutes);
app.use("/api/admin/gallery", adminGalleryRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/enquiries", enquiryRoutes);
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
