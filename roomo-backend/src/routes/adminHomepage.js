const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const defaults = require("../lib/homepageDefaults");
const router = express.Router();
const heroUploadDir = path.join(__dirname, "../../uploads/hero");
fs.mkdirSync(heroUploadDir, { recursive: true });
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const heroStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, heroUploadDir),
  filename: (req, file, cb) => {
    const extension = ({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif" })[file.mimetype];
    cb(null, Date.now() + "-" + crypto.randomBytes(8).toString("hex") + extension);
  }
});
const heroUpload = multer({
  storage: heroStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.has(file.mimetype)) return cb(new Error("Upload a JPG, PNG, WebP, or AVIF image."));
    cb(null, true);
  }
});
router.use(authenticateToken, requireAdmin);

const featuredRoomSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(160),
  type: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(250),
  rating: z.coerce.number().min(0).max(5).default(0),
  reviews: z.coerce.number().int().min(0).max(10000000).default(0),
  price: z.coerce.number().min(0).max(10000000),
  img: z.string().trim().url().max(2000),
  desc: z.string().trim().min(1).max(2000),
  featured: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0)
});
const featuredSectionSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(1000),
  rooms: z.array(featuredRoomSchema).max(30)
}).superRefine((data, ctx) => {
  const ids = data.rooms.map(room => room.id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rooms"], message: "Each room must have a unique ID." });
});

const homepageSchema = z.object({
  siteTitle: z.string().trim().min(5).max(160),
  heroBadge: z.string().trim().min(1).max(160),
  heroTitleLine: z.string().trim().min(1).max(120),
  heroTitleAccent: z.string().trim().min(1).max(120),
  heroDescription: z.string().trim().min(10).max(1000),
  heroImageUrl: z.string().trim().url().max(2000).refine(value => value.startsWith("https://") || value.startsWith("http://localhost:5001/uploads/"), "Use HTTPS for image URLs except local ROOMO uploads.").optional(),
  festivalTitle: z.string().trim().min(1).max(160),
  festivalDescription: z.string().trim().min(10).max(1000),
  festivalDate: z.string().trim().min(10).max(50),
  footerDescription: z.string().trim().min(10).max(500),
  contactPhone: z.string().trim().min(5).max(40),
  whatsappNumber: z.string().trim().regex(/^\d{8,15}$/),
  seoDescription: z.string().trim().min(10).max(300),
  contentOverrides: z.record(z.string().trim().min(1).max(240), z.object({ text: z.string().max(5000).optional(), href: z.string().max(2000).optional(), src: z.string().max(2000).optional(), alt: z.string().max(500).optional(), hidden: z.boolean().optional() }).strict()).optional(),
  testimonials: z.object({ eyebrow: z.string().trim().min(1).max(100), title: z.string().trim().min(1).max(160), description: z.string().trim().min(1).max(500), ratingSummary: z.string().trim().min(1).max(100), items: z.array(z.object({ id: z.string().trim().min(1).max(80), quote: z.string().trim().min(1).max(2000), name: z.string().trim().min(1).max(120), location: z.string().trim().max(120), rating: z.number().int().min(1).max(5), hidden: z.boolean() })).max(50) }).optional(),
  footerLinks: z.object({
    social: z.array(z.object({ label: z.string().trim().min(1).max(80), url: z.string().trim().min(1).max(500), icon: z.string().trim().min(1).max(80) })).max(12),
    sanctuaries: z.array(z.object({ label: z.string().trim().min(1).max(100), url: z.string().trim().min(1).max(500) })).max(20),
    pilgrimCare: z.array(z.object({ label: z.string().trim().min(1).max(100), url: z.string().trim().min(1).max(500) })).max(20),
    legal: z.array(z.object({ label: z.string().trim().min(1).max(100), url: z.string().trim().min(1).max(500) })).max(20)
  })
});
router.post("/hero-image", heroUpload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose an image to upload." });
  const baseUrl = req.protocol + "://" + req.get("host");
  res.status(201).json({
    message: "Hero image uploaded. Save Draft and publish to make it live.",
    heroImageUrl: baseUrl + "/uploads/hero/" + req.file.filename
  });
});

router.get("/featured-rooms", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const properties = await prisma.property.findMany({
      where: { isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ featuredSortOrder: "asc" }, { createdAt: "desc" }]
    });
    const source = row?.draft || row?.published || defaults;
    res.json({
      title: source.featuredSectionTitle || defaults.featuredSectionTitle,
      description: source.featuredSectionDescription || defaults.featuredSectionDescription,
      properties
    });
  } catch (error) { next(error); }
});
router.put("/featured-rooms", async (req, res, next) => {
  try {
    const parsed = z.object({
      title: z.string().trim().min(1).max(160),
      description: z.string().trim().min(1).max(1000),
      propertyIds: z.array(z.string().uuid()).max(100).optional()
    }).superRefine((data, ctx) => {
      if (data.propertyIds && new Set(data.propertyIds).size !== data.propertyIds.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["propertyIds"], message: "Duplicate featured property IDs are not allowed." });
      }
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please check the section title and description." });
    if (parsed.data.propertyIds) {
      const selected = await prisma.property.findMany({
        where: { id: { in: parsed.data.propertyIds }, isFeatured: true },
        select: { id: true }
      });
      if (selected.length !== parsed.data.propertyIds.length) {
        return res.status(400).json({ message: "The featured list changed. Reload Featured Rooms and try again." });
      }
      await prisma.$transaction(parsed.data.propertyIds.map((id, index) =>
        prisma.property.update({ where: { id }, data: { featuredSortOrder: index + 1 } })
      ));
    }
    const existing = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const section = { featuredSectionTitle: parsed.data.title, featuredSectionDescription: parsed.data.description };
    const draft = { ...(existing?.draft || defaults), ...section };
    const published = { ...(existing?.published || defaults), ...section };
    await prisma.homepageConfig.upsert({
      where: { id: 1 },
      create: { id: 1, draft, published, publishedAt: new Date() },
      update: { draft, published, publishedAt: new Date() }
    });
    const properties = await prisma.property.findMany({
      where: { isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ featuredSortOrder: "asc" }, { createdAt: "desc" }]
    });
    res.json({ message: "Featured section content saved and published. Room selection is managed in Rooms Listings.", ...parsed.data, properties });
  } catch (error) { next(error); }
});

router.get("/", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    res.json({ draft: row?.draft || defaults, published: row?.published || null, publishedAt: row?.publishedAt || null, hasPublished: Boolean(row?.published) });
  } catch (error) { next(error); }
});
router.put("/", async (req, res, next) => {
  try {
    const parsed = homepageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please check the homepage fields.", errors: parsed.error.flatten() });
    const existing = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const mergedDraft = { ...(existing?.draft || defaults), ...parsed.data, testimonials: parsed.data.testimonials || existing?.draft?.testimonials || defaults.testimonials };
    const row = await prisma.homepageConfig.upsert({
      where: { id: 1 }, create: { id: 1, draft: mergedDraft }, update: { draft: mergedDraft }
    });
    res.json({ message: "Draft saved. The public homepage has not changed yet.", draft: row.draft });
  } catch (error) { next(error); }
});
router.post("/publish", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const parsed = homepageSchema.safeParse({ ...(row?.draft || defaults), testimonials: row?.draft?.testimonials || defaults.testimonials });
    if (!parsed.success) return res.status(400).json({ message: "The saved draft is invalid. Save it again before publishing." });
    const featured = {
      featuredSectionTitle: row?.draft?.featuredSectionTitle || row?.published?.featuredSectionTitle || defaults.featuredSectionTitle,
      featuredSectionDescription: row?.draft?.featuredSectionDescription || row?.published?.featuredSectionDescription || defaults.featuredSectionDescription,
      featuredRooms: row?.draft?.featuredRooms || row?.published?.featuredRooms || defaults.featuredRooms
    };
    const publishedContent = { ...parsed.data, ...featured };
    const updated = await prisma.homepageConfig.upsert({
      where: { id: 1 },
      create: { id: 1, draft: { ...parsed.data, ...featured }, published: publishedContent, publishedAt: new Date() },
      update: { published: publishedContent, publishedAt: new Date() }
    });
    res.json({ message: "Homepage published successfully.", publishedAt: updated.publishedAt });
  } catch (error) { next(error); }
});
module.exports = router;
