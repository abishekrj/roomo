const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const defaults = require("../lib/homepageDefaults");

const router = express.Router();
const emptyConfig = { title: "Best Shops for Shopping", description: "Discover verified local shops in Tiruvannamalai.", enabled: true, shops: [] };
const shopSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(140),
  category: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(220),
  address: z.string().trim().max(500).default(""),
  openingHours: z.string().trim().max(160).default(""),
  contactNumber: z.string().trim().max(40).default(""),
  imageUrl: z.string().trim().max(2000).refine(v => !v || /^https?:\/\//i.test(v), "Use a valid image URL.").default(""),
  directionsUrl: z.string().trim().max(2000).refine(v => !v || /^https?:\/\//i.test(v), "Use a valid directions URL.").default(""),
  description: z.string().trim().max(2000).default(""),
  offerTag: z.string().trim().max(80).default(""),
  offerDetails: z.string().trim().max(500).default(""),
  specialties: z.string().trim().max(1200).default(""),
  priceRange: z.string().trim().max(100).default(""),
  visible: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0)
});
const configSchema = z.object({
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().min(2).max(500),
  enabled: z.boolean().default(true),
  shops: z.array(shopSchema).max(100)
}).superRefine((data, ctx) => {
  const ids = data.shops.map(shop => shop.id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["shops"], message: "Each shop must have a unique ID." });
});
function getConfig(row, key) {
  // Admin must edit the latest draft, even when an older published config exists.
  return row?.draft?.[key] || row?.published?.[key] || emptyConfig;
}
router.get("/", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const config = row?.published?.shoppingDirectory || emptyConfig;
    res.set("Cache-Control", "no-store");
    res.json({ ...config, shops: (config.shops || []).filter(shop => shop.visible).sort((a,b) => a.sortOrder-b.sortOrder) });
  } catch (error) { next(error); }
});
router.use(authenticateToken, requireAdmin);
router.get("/admin", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    res.json({ draft: getConfig(row, "shoppingDirectory"), published: row?.published?.shoppingDirectory || null, publishedAt: row?.publishedAt || null });
  } catch (error) { next(error); }
});
router.put("/admin", async (req, res, next) => {
  try {
    const parsed = configSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please check the shop details.", errors: parsed.error.flatten() });
    const config = { ...parsed.data, shops: parsed.data.shops.map((shop, index) => ({ ...shop, sortOrder: Number.isFinite(shop.sortOrder) ? shop.sortOrder : index + 1 })) };
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const draft = { ...(row?.draft || defaults), shoppingDirectory: config };
    const published = { ...(row?.published || row?.draft || defaults), shoppingDirectory: config };
    const updated = await prisma.homepageConfig.upsert({
      where: { id: 1 },
      create: { id: 1, draft, published, publishedAt: new Date() },
      update: { draft, published, publishedAt: new Date() }
    });
    res.json({ message: "Shopping directory saved and published.", draft: updated.draft.shoppingDirectory, publishedAt: updated.publishedAt });
  } catch (error) { next(error); }
});
module.exports = router;
