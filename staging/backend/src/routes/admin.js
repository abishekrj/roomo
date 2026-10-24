
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// Every route in this file requires authentication and ADMIN permission.
router.use(authenticateToken, requireAdmin);

// Store new property images alongside existing ROOMO uploads, matching the directory served by server.js.\nconst uploadsRoot = path.resolve(process.env.ROOMO_UPLOAD_DIR || path.join(__dirname, "../../../../roomo-backend/uploads"));\nconst propertyUploadDir = path.join(uploadsRoot, "properties");
fs.mkdirSync(propertyUploadDir, { recursive: true });
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const propertyStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, propertyUploadDir),
  filename: (req, file, cb) => {
    const extension = ({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif" })[file.mimetype];
    cb(null, Date.now() + "-" + crypto.randomBytes(8).toString("hex") + extension);
  }
});
const propertyImageUpload = multer({
  storage: propertyStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.has(file.mimetype)) return cb(new Error("Upload JPG, PNG, WebP, or AVIF images only."));
    cb(null, true);
  }
});
router.post("/property-images/upload", propertyImageUpload.array("images", 10), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: "Choose at least one image to upload." });
  const baseUrl = req.protocol + "://" + req.get("host");
  res.status(201).json({
    message: "Property images uploaded.",
    images: req.files.map((file, index) => ({ imageUrl: baseUrl + "/uploads/properties/" + file.filename, originalName: file.originalname, sortOrder: index }))
  });
});

const propertySchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(20).max(5000),
  propertyType: z.string().trim().min(2).max(60),
  address: z.string().trim().min(5).max(250),
  mapLocation: z.string().trim().max(1000).optional().nullable().transform((value) => value || null),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100).default("India"),
  postalCode: z.string().trim().max(20).optional().nullable(),
  nightlyPrice: z.coerce.number().positive().finite().max(10000000),
  maxGuests: z.coerce.number().int().min(1).max(100),
  bedrooms: z.coerce.number().int().min(0).max(100).default(1),
  bathrooms: z.coerce.number().int().min(1).max(100).default(1),
  livingRooms: z.coerce.number().int().min(0).max(100).default(1),
  kitchens: z.coerce.number().int().min(0).max(100).default(1),
  areaSquareMeters: z.coerce.number().positive().max(100000).optional().nullable(),
  bedConfiguration: z.array(z.object({ type: z.string().trim().min(1).max(80), count: z.coerce.number().int().min(1).max(50) })).max(20).default([]),
  allowPayAtProperty: z.boolean().default(false),
  noCreditCardRequired: z.boolean().default(false),
  availabilityCount: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  amenities: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
  nearbyLandmarks: z.array(z.enum(["annamalaiyar-temple", "sri-ramanasramam", "girivalam-path", "arunachala-hill", "skandashramam", "virupaksha-cave", "sathanur-dam", "central-bus-stand", "railway-station", "yogi-ram-surathkumar-ashram"])).max(10).default([]),
  perks: z.array(z.string().trim().min(2).max(100)).max(8).default([]),
  imageUrls: z.array(z.string().url().max(2048)).max(10).default([]),
  isFeatured: z.boolean().default(false),
  featuredSortOrder: z.coerce.number().int().min(0).max(10000).default(0),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

const statusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});


// GET /api/admin/reservations — all guest reservation requests for Super Admin.
router.get("/reservations", async (req, res, next) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        guest: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        property: { select: { id: true, title: true, city: true, state: true, address: true, owner: { select: { id: true, fullName: true, email: true, phoneNumber: true } } } },
        roomType: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    res.json({ reservations });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/registered-users
// Return guest account details only; never expose password hashes or credentials.
router.get("/registered-users", async (req, res, next) => {
  try {
    const users = await prisma.guestUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        authProvider: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    res.json({ users, total: users.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/properties
// List all properties, including drafts and archived listings.
router.get("/properties", async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        owner: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    res.json({ properties });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/properties
// Create listings under the administrator account.
router.post("/properties", async (req, res, next) => {
  try {
    const result = propertySchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Please check the property details.",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const data = result.data;

    const property = await prisma.property.create({
      data: {
        ownerId: req.admin.id,
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        address: data.address,
        mapLocation: data.mapLocation,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode || null,
        nightlyPrice: data.nightlyPrice,
        maxGuests: data.maxGuests,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        livingRooms: data.livingRooms,
        kitchens: data.kitchens,
        areaSquareMeters: data.areaSquareMeters ?? null,
        bedConfiguration: data.bedConfiguration,
        allowPayAtProperty: data.allowPayAtProperty,
        noCreditCardRequired: data.noCreditCardRequired,
        availabilityCount: data.availabilityCount ?? null,
        amenities: data.amenities,
        nearbyLandmarks: data.nearbyLandmarks,
        perks: data.perks,
        isFeatured: data.isFeatured,
        featuredSortOrder: data.featuredSortOrder,
        status: data.status,
        images: {
          create: data.imageUrls.map((imageUrl, index) => ({
            imageUrl,
            sortOrder: index,
          })),
        },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    res.status(201).json({
      message: "Property created successfully.",
      property,
    });
  } catch (error) {
    next(error);
  }
});


router.patch("/properties/:id", async (req, res, next) => {
  try {
    const idResult = z.string().uuid().safeParse(req.params.id);

    if (!idResult.success) {
      return res.status(400).json({
        message: "Invalid property ID."
      });
    }

    const result = propertySchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Please check the property details.",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message
        }))
      });
    }

    const data = result.data;

    const existing = await prisma.property.findUnique({
      where: { id: idResult.data },
      select: { id: true }
    });

    if (!existing) {
      return res.status(404).json({
        message: "Property not found."
      });
    }

    const property = await prisma.$transaction(async (tx) => {
      await tx.property.update({
        where: { id: idResult.data },
        data: {
          title: data.title,
          description: data.description,
          propertyType: data.propertyType,
          address: data.address,
          mapLocation: data.mapLocation,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode || null,
          nightlyPrice: data.nightlyPrice,
          maxGuests: data.maxGuests,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          livingRooms: data.livingRooms,
          kitchens: data.kitchens,
          areaSquareMeters: data.areaSquareMeters ?? null,
          bedConfiguration: data.bedConfiguration,
          allowPayAtProperty: data.allowPayAtProperty,
        noCreditCardRequired: data.noCreditCardRequired,
          availabilityCount: data.availabilityCount ?? null,
          amenities: data.amenities,
          nearbyLandmarks: data.nearbyLandmarks,
          perks: data.perks,
          isFeatured: data.isFeatured,
          featuredSortOrder: data.featuredSortOrder,
          status: data.status
        }
      });

      await tx.propertyImage.deleteMany({
        where: { propertyId: idResult.data }
      });

      if (data.imageUrls.length > 0) {
        await tx.propertyImage.createMany({
          data: data.imageUrls.map((imageUrl, index) => ({
            propertyId: idResult.data,
            imageUrl,
            sortOrder: index
          }))
        });
      }

      return tx.property.findUnique({
        where: { id: idResult.data },
        include: {
          images: { orderBy: { sortOrder: "asc" } }
        }
      });
    });

    return res.json({
      message: "Property updated successfully.",
      property
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/properties/:id/map-location
// Save the dedicated Google Maps embed URL for an existing property.
router.patch("/properties/:id/map-location", async (req, res, next) => {
  try {
    const idResult = z.string().uuid().safeParse(req.params.id);
    const bodyResult = z.object({
      mapLocation: z.string().trim().max(1000).optional().nullable()
    }).safeParse(req.body);
    if (!idResult.success) return res.status(400).json({ message: "Invalid property ID." });
    if (!bodyResult.success) return res.status(400).json({ message: "Please provide a valid Google Maps embed URL." });

    const mapLocation = bodyResult.data.mapLocation || null;
    if (mapLocation) {
      let parsed;
      try { parsed = new URL(mapLocation); } catch {
        return res.status(400).json({ message: "Enter a valid Google Maps embed URL." });
      }
      if (parsed.protocol !== "https:" || parsed.hostname !== "www.google.com" || parsed.pathname !== "/maps/embed") {
        return res.status(400).json({ message: "Use the HTTPS Google Maps embed URL copied from Google Maps → Share → Embed a map." });
      }
    }

    const existing = await prisma.property.findUnique({ where: { id: idResult.data }, select: { id: true } });
    if (!existing) return res.status(404).json({ message: "Property not found." });

    const property = await prisma.property.update({
      where: { id: idResult.data },
      data: { mapLocation },
      select: { id: true, mapLocation: true }
    });
    res.json({ message: "Google Maps URL saved successfully.", property });
  } catch (error) { next(error); }
});

// PATCH /api/admin/properties/:id/featured
router.patch("/properties/:id/featured", async (req, res, next) => {
  try {
    const idResult = z.string().uuid().safeParse(req.params.id);
    const bodyResult = z.object({
      isFeatured: z.boolean(),
      featuredSortOrder: z.coerce.number().int().min(0).max(10000).default(0)
    }).safeParse(req.body);
    if (!idResult.success) return res.status(400).json({ message: "Invalid property ID." });
    if (!bodyResult.success) return res.status(400).json({ message: "Choose whether this property should be featured." });
    const existing = await prisma.property.findUnique({ where: { id: idResult.data }, select: { id: true } });
    if (!existing) return res.status(404).json({ message: "Property not found." });
    const property = await prisma.property.update({
      where: { id: idResult.data },
      data: { isFeatured: bodyResult.data.isFeatured, featuredSortOrder: bodyResult.data.featuredSortOrder },
      include: { images: { orderBy: { sortOrder: "asc" } } }
    });
    res.json({ message: property.isFeatured ? "Property added to Featured Rooms." : "Property removed from Featured Rooms.", property });
  } catch (error) { next(error); }
});

// PATCH /api/admin/properties/:id/status
// Change a listing's publication status.
router.patch("/properties/:id/status", async (req, res, next) => {
  try {
    const idResult = z.string().uuid().safeParse(req.params.id);
    const bodyResult = statusSchema.safeParse(req.body);

    if (!idResult.success) {
      return res.status(400).json({ message: "Invalid property ID." });
    }

    if (!bodyResult.success) {
      return res.status(400).json({
        message: "Status must be DRAFT, PUBLISHED, or ARCHIVED.",
      });
    }

    const existing = await prisma.property.findUnique({
      where: { id: idResult.data },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ message: "Property not found." });
    }

    const property = await prisma.property.update({
      where: { id: idResult.data },
      data: { status: bodyResult.data.status },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    res.json({
      message: "Property status updated successfully.",
      property,
    });
  } catch (error) {
    next(error);
  }
});



router.post("/owners", async (req, res, next) => {
  const parsed = z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(12).max(72),
    phoneNumber: z.string().trim().regex(/^\+[1-9]\d{7,14}$/).optional().or(z.literal("")),
  }).safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const fieldMessages = {
      fullName: "Enter the owner's full name (at least 2 characters).",
      email: "Enter a valid email address.",
      password: "Use a password between 12 and 72 characters.",
      phoneNumber: "Enter the phone with country code, for example +919876543210, or leave it blank.",
    };
    return res.status(400).json({
      message: fieldMessages[issue.path[0]] || "Please check the owner details.",
      field: issue.path[0] || null,
    });
  }
  try {
    const owner = await prisma.owner.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email.toLowerCase(),
        phoneNumber: parsed.data.phoneNumber || null,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        role: "OWNER",
        canEditProperties: false,
      },
      select: { id: true, fullName: true, email: true, phoneNumber: true, canEditProperties: true, createdAt: true },
    });
    res.status(201).json({ message: "Owner account created. Share the sign-in details securely with the owner.", owner });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "An account with this email or phone number already exists." });
    next(error);
  }
});

router.patch("/properties/:id/owner", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const body = z.object({ ownerId: z.string().uuid() }).safeParse(req.body);
  if (!id.success || !body.success) return res.status(400).json({ message: "Choose a valid property and owner." });
  try {
    const owner = await prisma.owner.findFirst({ where: { id: body.data.ownerId, role: "OWNER" }, select: { id: true } });
    if (!owner) return res.status(404).json({ message: "Owner account not found." });
    const property = await prisma.property.update({
      where: { id: id.data },
      data: { ownerId: owner.id },
      select: { id: true, title: true, owner: { select: { id: true, fullName: true, email: true } } },
    }).catch(error => error.code === "P2025" ? null : Promise.reject(error));
    if (!property) return res.status(404).json({ message: "Property not found." });
    res.json({ message: "Property assigned to " + property.owner.fullName + ".", property });
  } catch (error) { next(error); }
});

router.get("/owners", async (req, res, next) => {
  try {
    const owners = await prisma.owner.findMany({
      where: { role: "OWNER" },
      select: {
        id: true, fullName: true, email: true, phoneNumber: true,
        canEditProperties: true, createdAt: true,
        _count: { select: { properties: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ owners });
  } catch (error) { next(error); }
});

// POST /api/admin/owners/:id/reset-password
// Allows an authenticated super admin to set a fresh temporary password for an owner.
router.post("/owners/:id/reset-password", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const body = z.object({ password: z.string().min(12).max(72) }).safeParse(req.body);
  if (!id.success) return res.status(400).json({ message: "Invalid owner ID." });
  if (!body.success) return res.status(400).json({ message: "Use a temporary password between 12 and 72 characters." });
  try {
    const owner = await prisma.owner.findFirst({
      where: { id: id.data, role: "OWNER" },
      select: { id: true },
    });
    if (!owner) return res.status(404).json({ message: "Owner account not found." });
    const passwordHash = await bcrypt.hash(body.data.password, 12);
    await prisma.owner.update({ where: { id: owner.id }, data: { passwordHash } });
    return res.json({ message: "Owner password reset successfully. Sign in using the new temporary password." });
  } catch (error) {
    next(error);
  }
});

router.patch("/owners/:id/property-edit-permission", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const body = z.object({ canEditProperties: z.boolean() }).safeParse(req.body);
  if (!id.success || !body.success) return res.status(400).json({ message: "Choose a valid owner and permission value." });
  try {
    const owner = await prisma.owner.findFirst({
      where: { id: id.data, role: "OWNER" },
      select: { id: true },
    });
    if (!owner) return res.status(404).json({ message: "Owner account not found." });
    const updated = await prisma.owner.update({
      where: { id: owner.id },
      data: { canEditProperties: body.data.canEditProperties },
      select: { id: true, fullName: true, canEditProperties: true },
    });
    res.json({ message: updated.canEditProperties ? "Property editing enabled for this owner." : "Property editing disabled for this owner.", owner: updated });
  } catch (error) { next(error); }
});

module.exports = router;
