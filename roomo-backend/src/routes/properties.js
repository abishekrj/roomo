
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
  imageUrls: z.array(z.string().url().max(2000)).max(10).default([]),
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
