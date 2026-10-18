const express = require("express");
const prisma = require("../lib/prisma");
const defaults = require("../lib/homepageDefaults");
const router = express.Router();
router.get("/", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    res.set("Cache-Control", "no-store");
    res.json({ content: row?.published || defaults, publishedAt: row?.publishedAt || null });
  } catch (error) { next(error); }
});
module.exports = router;
