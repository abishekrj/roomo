
const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

const propertyInput = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(20).max(5000),
  propertyType: z.string().trim().min(2).max(60),
  address: z.string().trim().min(5).max(250),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100).default("India"),
  postalCode: z.string().trim().max(20).optional().nullable(),
  nightlyPrice: z.coerce.number().positive().max(10000000),
  maxGuests: z.coerce.number().int().min(1).max(100),
  bedrooms: z.coerce.number().int().min(1).max(100).default(1),
  bathrooms: z.coerce.number().int().min(1).max(100).default(1),
  livingRooms: z.coerce.number().int().min(0).max(100).default(0),
  kitchens: z.coerce.number().int().min(0).max(100).default(0),
  areaSquareMeters: z.coerce.number().positive().max(100000).optional().nullable(),
  totalUnits: z.coerce.number().int().min(1).max(1000).default(1),
  availabilityCount: z.coerce.number().int().min(0).max(1000).optional().nullable(),
  mapLocation: z.string().trim().max(1000).optional().nullable(),
  bedConfiguration: z.array(z.any()).max(30).default([]),
  allowPayAtProperty: z.coerce.boolean().default(false),
  noCreditCardRequired: z.coerce.boolean().default(false),
  policies: z.record(z.string(), z.any()).default({}),
  showPolicies: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  featuredSortOrder: z.coerce.number().int().min(0).max(10000).default(0),
  media: z.array(z.record(z.string(), z.any())).max(30).default([]),
  amenities: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
  nearbyLandmarks: z.array(z.enum(["annamalaiyar-temple", "sri-ramanasramam", "girivalam-path", "arunachala-hill", "skandashramam", "virupaksha-cave", "sathanur-dam", "central-bus-stand", "railway-station", "yogi-ram-surathkumar-ashram"])).max(10).default([]),
  perks: z.array(z.string().trim().min(2).max(100)).max(8).default([]),
  imageUrls: z.array(z.string().url().max(2000)).max(10).default([]),
});


const ownerPropertyEditSchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(20).max(5000),
  address: z.string().trim().min(5).max(250),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(20).optional().nullable(),
  mapLocation: z.string().trim().max(1000).optional().nullable(),
  nightlyPrice: z.coerce.number().positive().max(10000000),
  maxGuests: z.coerce.number().int().min(1).max(100),
  bedrooms: z.coerce.number().int().min(1).max(100),
  bathrooms: z.coerce.number().int().min(1).max(100),
  amenities: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
  imageUrls: z.array(z.string().url().max(2000)).max(10).default([]),
});

// Owners can create a complete property listing in their own workspace. New listings remain drafts until submitted.
router.post("/owner", authenticateToken, async (req, res, next) => {
  const parsed = propertyInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Please complete the required property details.", errors: parsed.error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })) });
  try {
    const owner = await prisma.owner.findUnique({ where: { id: req.owner.sub }, select: { id: true, role: true } });
    if (!owner || owner.role !== "OWNER") return res.status(403).json({ message: "Owner account required." });
    const { imageUrls, ...data } = parsed.data;
    const property = await prisma.property.create({
      data: { ...data, ownerId: owner.id, status: "DRAFT", isFeatured: false, featuredSortOrder: 0,
        images: { create: imageUrls.map((imageUrl, index) => ({ imageUrl, sortOrder: index })) } },
      include: { images: { orderBy: { sortOrder: "asc" } } }
    });
    res.status(201).json({ message: "Draft saved. You can continue editing or submit it for approval.", property });
  } catch (error) { next(error); }
});

// Save edits to an owner's own draft or previously rejected listing.
router.patch("/owner/:id/draft", authenticateToken, async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const parsed = propertyInput.safeParse(req.body);
  if (!id.success || !parsed.success) return res.status(400).json({ message: "Please check the property details.", errors: parsed.success ? [] : parsed.error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })) });
  try {
    const owner = await prisma.owner.findUnique({ where: { id: req.owner.sub }, select: { id: true, role: true } });
    if (!owner || owner.role !== "OWNER") return res.status(403).json({ message: "Owner account required." });
    const existing = await prisma.property.findFirst({ where: { id: id.data, ownerId: owner.id } });
    if (!existing) return res.status(404).json({ message: "Property not found in your owner account." });
    if (!["DRAFT", "REJECTED"].includes(existing.status)) return res.status(409).json({ message: "Only draft or returned properties can be edited here." });
    const { imageUrls, ...data } = parsed.data;
    const property = await prisma.$transaction(async tx => {
      await tx.property.update({ where: { id: id.data }, data: { ...data, isFeatured: false, featuredSortOrder: 0, status: existing.status === "REJECTED" ? "REJECTED" : "DRAFT" } });
      await tx.propertyImage.deleteMany({ where: { propertyId: id.data } });
      if (imageUrls.length) await tx.propertyImage.createMany({ data: imageUrls.map((imageUrl, index) => ({ propertyId: id.data, imageUrl, sortOrder: index })) });
      return tx.property.findUnique({ where: { id: id.data }, include: { images: { orderBy: { sortOrder: "asc" } } } });
    });
    res.json({ message: "Property draft saved.", property });
  } catch (error) { next(error); }
});

// Owner explicitly submits a saved draft for Super Admin review.
router.post("/owner/:id/submit", authenticateToken, async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ message: "Invalid property ID." });
  try {
    const owner = await prisma.owner.findUnique({ where: { id: req.owner.sub }, select: { id: true, role: true } });
    if (!owner || owner.role !== "OWNER") return res.status(403).json({ message: "Owner account required." });
    const property = await prisma.property.findFirst({ where: { id: id.data, ownerId: owner.id } });
    if (!property) return res.status(404).json({ message: "Property not found in your owner account." });
    if (!["DRAFT", "REJECTED"].includes(property.status)) return res.status(409).json({ message: "This property has already been submitted or published." });
    const updated = await prisma.property.update({ where: { id: property.id }, data: { status: "PENDING_APPROVAL" } });
    res.json({ message: "Property submitted for Super Admin approval.", property: updated });
  } catch (error) { next(error); }
});

// Owners can see only their own properties, including drafts.
router.get("/owner", authenticateToken, async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      where: { ownerId: req.owner.sub },
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ properties });
  } catch (error) { next(error); }
});

// Owner edits are disabled by default and must be enabled by an administrator.
router.patch("/owner/:id", authenticateToken, async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const parsed = ownerPropertyEditSchema.safeParse(req.body);
  if (!id.success || !parsed.success) {
    return res.status(400).json({ message: "Please check the property details." });
  }
  try {
    const owner = await prisma.owner.findUnique({
      where: { id: req.owner.sub },
      select: { role: true, canEditProperties: true },
    });
    if (!owner || owner.role !== "OWNER") return res.status(403).json({ message: "Owner account required." });
    if (!owner.canEditProperties) return res.status(403).json({ message: "Property editing is currently disabled by ROOMO administration." });
    const existing = await prisma.property.findFirst({ where: { id: id.data, ownerId: req.owner.sub }, select: { id: true } });
    if (!existing) return res.status(404).json({ message: "Property not found in your owner account." });
    const data = parsed.data;
    const property = await prisma.$transaction(async (tx) => {
      await tx.property.update({
        where: { id: id.data },
        data: {
          title: data.title, description: data.description, address: data.address,
          city: data.city, state: data.state, postalCode: data.postalCode || null,
          mapLocation: data.mapLocation || null, nightlyPrice: data.nightlyPrice,
          maxGuests: data.maxGuests, bedrooms: data.bedrooms, bathrooms: data.bathrooms,
          amenities: data.amenities,
        },
      });
      await tx.propertyImage.deleteMany({ where: { propertyId: id.data } });
      if (data.imageUrls.length) {
        await tx.propertyImage.createMany({
          data: data.imageUrls.map((imageUrl, index) => ({ propertyId: id.data, imageUrl, sortOrder: index })),
        });
      }
      return tx.property.findUnique({ where: { id: id.data }, include: { images: { orderBy: { sortOrder: "asc" } } } });
    });
    res.json({ message: "Property details saved.", property });
  } catch (error) { next(error); }
});

// GET /api/properties
// Publicly show published stays only.
router.get("/", async (req, res, next) => {
  try {
    const querySchema = z.object({
      city: z.string().trim().max(100).optional(),
      guests: z.coerce.number().int().min(1).max(100).optional(),
      minPrice: z.coerce.number().min(0).optional(),
      maxPrice: z.coerce.number().min(0).optional(),
      propertyType: z.string().trim().max(60).optional(),
      sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(12),
    });

    const parsed = querySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid search filters.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const {
      city,
      guests,
      minPrice,
      maxPrice,
      propertyType,
      sort,
      page,
      limit,
    } = parsed.data;

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      return res.status(400).json({
        message: "minPrice cannot be greater than maxPrice.",
      });
    }

    const where = {
      status: "PUBLISHED",
      ...(city && {
        city: { contains: city, mode: "insensitive" },
      }),
      ...(guests && { maxGuests: { gte: guests } }),
      ...(propertyType && {
        propertyType: { equals: propertyType, mode: "insensitive" },
      }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        nightlyPrice: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
    };

    const orderBy =
      sort === "price_asc"
        ? { nightlyPrice: "asc" }
        : sort === "price_desc"
          ? { nightlyPrice: "desc" }
          : { createdAt: "desc" };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: "asc" } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    res.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/properties/:id
// Publicly show one published stay.
// GET /api/properties/:id/room-types — active room categories for a published property.
router.get("/:id/room-types", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ message: "Invalid property ID." });
  try {
    const property = await prisma.property.findFirst({
      where: { id: id.data, status: "PUBLISHED" },
      select: { id: true, title: true, city: true, state: true }
    });
    if (!property) return res.status(404).json({ message: "Property not found." });
    const roomTypes = await prisma.roomType.findMany({
      where: { propertyId: property.id, isActive: true, quantity: { gt: 0 } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });
    res.json({ property, roomTypes });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const idSchema = z.string().uuid().safeParse(req.params.id);

    if (!idSchema.success) {
      return res.status(400).json({ message: "Invalid property ID." });
    }

    const property = await prisma.property.findFirst({
      where: {
        id: idSchema.data,
        status: "PUBLISHED",
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        roomTypes: {
          where: { isActive: true, quantity: { gt: 0 } },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }

    res.json({ property });
  } catch (error) {
    next(error);
  }
});

// POST /api/properties
// A logged-in owner can create a draft property.
router.post("/", authenticateToken, async (req, res, next) => {
  try {
    const parsed = propertyInput.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Please check the property details.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const {
      imageUrls,
      postalCode,
      ...propertyData
    } = parsed.data;

    const property = await prisma.property.create({
      data: {
        ...propertyData,
        ...(postalCode !== undefined && { postalCode }),
        // Never accept ownerId or status from the browser.
        ownerId: req.owner.sub,
        images: {
          create: imageUrls.map((imageUrl, index) => ({
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
      message: "Property submitted successfully. It is saved as a draft.",
      property,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
