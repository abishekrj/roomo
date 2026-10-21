const express = require("express");
const prisma = require("../lib/prisma");
const router = express.Router();

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
