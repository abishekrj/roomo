const express = require("express");
const prisma = require("../lib/prisma");
const defaults = require("../lib/galleryDefaults");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const items = await prisma.galleryItem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });
    const totalItems = await prisma.galleryItem.count();
    const visibleItems = totalItems === 0 ? defaults : items;
    res.set("Cache-Control", "no-store");
    res.json({ items: visibleItems, usingDefaults: totalItems === 0 });
  } catch (error) { next(error); }
});

module.exports = router;
