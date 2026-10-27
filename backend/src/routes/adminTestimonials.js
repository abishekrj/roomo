const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const defaults = require("../lib/homepageDefaults");
const router = express.Router();
router.use(authenticateToken, requireAdmin);

const testimonialSchema = z.object({
  eyebrow: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(500),
  ratingSummary: z.string().trim().min(1).max(100),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(80),
    quote: z.string().trim().min(1).max(2000),
    name: z.string().trim().min(1).max(120),
    location: z.string().trim().max(120),
    rating: z.number().int().min(1).max(5),
    hidden: z.boolean()
  })).max(50)
});

router.get("/", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    res.json({
      draft: row?.draft?.testimonials || defaults.testimonials,
      published: row?.published?.testimonials || null,
      publishedAt: row?.publishedAt || null,
      hasPublished: Boolean(row?.published?.testimonials)
    });
  } catch (error) { next(error); }
});

router.put("/", async (req, res, next) => {
  try {
    const parsed = testimonialSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please check the testimonial fields.", errors: parsed.error.flatten() });
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const draft = { ...(row?.draft || defaults), testimonials: parsed.data };
    const updated = await prisma.homepageConfig.upsert({
      where: { id: 1 },
      create: { id: 1, draft },
      update: { draft }
    });
    res.json({ message: "Testimonials draft saved. Publish it when you're ready for visitors to see the changes.", draft: updated.draft.testimonials });
  } catch (error) { next(error); }
});

router.post("/publish", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const testimonials = row?.draft?.testimonials || defaults.testimonials;
    const published = { ...(row?.published || row?.draft || defaults), testimonials };
    const updated = await prisma.homepageConfig.upsert({
      where: { id: 1 },
      create: { id: 1, draft: { ...(row?.draft || defaults), testimonials }, published, publishedAt: new Date() },
      update: { published, publishedAt: new Date() }
    });
    res.json({ message: "Testimonials published successfully.", publishedAt: updated.publishedAt });
  } catch (error) { next(error); }
});

module.exports = router;
