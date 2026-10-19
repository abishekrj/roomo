const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const defaults = require("../lib/homepageDefaults");
const router = express.Router();
router.use(authenticateToken, requireAdmin);
const homepageSchema = z.object({
  siteTitle: z.string().trim().min(5).max(160),
  heroBadge: z.string().trim().min(1).max(160),
  heroTitleLine: z.string().trim().min(1).max(120),
  heroTitleAccent: z.string().trim().min(1).max(120),
  heroDescription: z.string().trim().min(10).max(1000),
  festivalTitle: z.string().trim().min(1).max(160),
  festivalDescription: z.string().trim().min(10).max(1000),
  festivalDate: z.string().trim().min(10).max(50),
  footerDescription: z.string().trim().min(10).max(500),
  contactPhone: z.string().trim().min(5).max(40),
  whatsappNumber: z.string().trim().regex(/^\d{8,15}$/),
  seoDescription: z.string().trim().min(10).max(300),
  testimonials: z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().min(1).max(500), ratingSummary: z.string().trim().min(1).max(100), items: z.array(z.object({ id: z.string().trim().min(1).max(80), quote: z.string().trim().min(1).max(2000), name: z.string().trim().min(1).max(120), location: z.string().trim().max(120), rating: z.number().int().min(1).max(5), hidden: z.boolean() })).max(50) }).optional(),
  footerLinks: z.object({
    social: z.array(z.object({ label: z.string().trim().min(1).max(80), url: z.string().trim().min(1).max(500), icon: z.string().trim().min(1).max(80) })).max(12),
    sanctuaries: z.array(z.object({ label: z.string().trim().min(1).max(100), url: z.string().trim().min(1).max(500) })).max(20),
    pilgrimCare: z.array(z.object({ label: z.string().trim().min(1).max(100), url: z.string().trim().min(1).max(500) })).max(20),
    legal: z.array(z.object({ label: z.string().trim().min(1).max(100), url: z.string().trim().min(1).max(500) })).max(20)
  })
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
    const updated = await prisma.homepageConfig.upsert({
      where: { id: 1 },
      create: { id: 1, draft: parsed.data, published: parsed.data, publishedAt: new Date() },
      update: { published: parsed.data, publishedAt: new Date() }
    });
    res.json({ message: "Homepage published successfully.", publishedAt: updated.publishedAt });
  } catch (error) { next(error); }
});
module.exports = router;
