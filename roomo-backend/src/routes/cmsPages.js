const express = require("express");
const prisma = require("../lib/prisma");
const router = express.Router();

// Public index of published CMS pages, used by the shared footer.
router.get("/", async (req, res, next) => {
  try {
    const rows = await prisma.cMSPage.findMany({
      where: { isPublished: true },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, published: true }
    });
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json({ pages: rows.map(row => ({ slug: row.slug, title: row.published?.title || row.slug, seoTitle: row.published?.seoTitle || "" })) });
  } catch (error) { next(error); }
});

// Only published content is exposed publicly.
router.get("/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    const page = await prisma.cMSPage.findFirst({
      where: { slug, isPublished: true },
      select: { slug: true, published: true, publishedAt: true }
    });
    if (!page || !page.published) return res.status(404).json({ message: "Page not found." });
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json({ page: { slug: page.slug, ...page.published, publishedAt: page.publishedAt } });
  } catch (error) { next(error); }
});

module.exports = router;
