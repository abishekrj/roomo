const express = require("express");
const prisma = require("../lib/prisma");
const defaults = require("../lib/homepageDefaults");
const router = express.Router();
router.get("/", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const content = row?.published || defaults;
    const featuredProperties = await prisma.property.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ featuredSortOrder: "asc" }, { createdAt: "desc" }]
    });
    res.set("Cache-Control", "no-store");
    res.json({ content: { ...content, featuredProperties }, publishedAt: row?.publishedAt || null });
  } catch (error) { next(error); }
});
module.exports = router;
