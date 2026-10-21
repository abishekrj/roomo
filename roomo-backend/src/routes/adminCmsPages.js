const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const router = express.Router();
router.use(authenticateToken, requireAdmin);

const sectionSchema = z.object({
  heading: z.string().trim().max(180).default(""),
  body: z.string().trim().min(1).max(12000)
});
const pageSchema = z.object({
  slug: z.string().trim().toLowerCase().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens for the URL."),
  title: z.string().trim().min(5).max(180),
  subtitle: z.string().trim().max(300).default(""),
  seoTitle: z.string().trim().min(5).max(160),
  seoDescription: z.string().trim().min(10).max(300),
  heroImageUrl: z.string().trim().max(2000).default(""),
  intro: z.string().trim().min(20).max(5000),
  sections: z.array(sectionSchema).min(1).max(20),
  ctaTitle: z.string().trim().max(180).default(""),
  ctaText: z.string().trim().max(1000).default(""),
  ctaLabel: z.string().trim().max(100).default("Explore stays"),
  ctaUrl: z.string().trim().max(500).default("roomo-search-results.html")
});
router.get("/", async (req, res, next) => {
  try {
    const rows = await prisma.cMSPage.findMany({ orderBy: [{ updatedAt: "desc" }] });
    res.json({ pages: rows.map(row => ({ id: row.id, slug: row.slug, draft: row.draft, published: row.published, isPublished: row.isPublished, publishedAt: row.publishedAt, updatedAt: row.updatedAt })) });
  } catch (error) { next(error); }
});
async function savePage(req, res, next) {
  try {
    const parsed = pageSchema.safeParse(req.body.page);
    if (!parsed.success) return res.status(400).json({ message: "Please check the page fields.", errors: parsed.error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })) });
    const data = parsed.data;
    const publish = req.body.publish === true;
    const id = req.params.id && req.params.id !== "new" ? req.params.id : null;
    const duplicate = await prisma.cMSPage.findFirst({ where: { slug: data.slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
    if (duplicate) return res.status(409).json({ message: "That page URL is already in use. Choose a different URL." });
    let row;
    if (id) {
      row = await prisma.cMSPage.update({
        where: { id },
        data: { slug: data.slug, draft: data, ...(publish ? { published: data, isPublished: true, publishedAt: new Date() } : {}) }
      });
    } else {
      row = await prisma.cMSPage.create({
        data: { slug: data.slug, draft: data, published: publish ? data : null, isPublished: publish, publishedAt: publish ? new Date() : null }
      });
    }
    res.json({ message: publish ? "Page published successfully." : "Draft saved successfully.", page: { id: row.id, slug: row.slug, draft: row.draft, published: row.published, isPublished: row.isPublished, publishedAt: row.publishedAt, updatedAt: row.updatedAt } });
  } catch (error) { next(error); }
}
router.put("/", savePage);
router.put("/:id", savePage);
router.post("/:id/publish", async (req, res, next) => {
  try {
    const row = await prisma.cMSPage.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ message: "CMS page not found." });
    const parsed = pageSchema.safeParse(row.draft);
    if (!parsed.success) return res.status(400).json({ message: "Please edit and save the draft before publishing." });
    const published = await prisma.cMSPage.update({ where: { id: row.id }, data: { published: parsed.data, isPublished: true, publishedAt: new Date() } });
    res.json({ message: "Page published successfully.", page: { id: published.id, slug: published.slug, draft: published.draft, published: published.published, isPublished: published.isPublished, publishedAt: published.publishedAt } });
  } catch (error) { next(error); }
});
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.cMSPage.delete({ where: { id: req.params.id } });
    res.json({ message: "CMS page deleted." });
  } catch (error) { next(error); }
});
module.exports = router;
