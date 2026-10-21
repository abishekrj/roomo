const express = require("express");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();
const defaults = { count: 0, visible: true };

function readStats(row) {
  return row?.published?.visitorStats || row?.draft?.visitorStats || defaults;
}

async function writeStats(stats) {
  const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
  const draft = { ...(row?.draft || {}), visitorStats: stats };
  const published = { ...(row?.published || row?.draft || {}), visitorStats: stats };
  return prisma.homepageConfig.upsert({
    where: { id: 1 },
    create: { id: 1, draft, published, publishedAt: new Date() },
    update: { draft, published, publishedAt: row?.publishedAt || new Date() }
  });
}

router.get("/", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const stats = readStats(row);
    res.set("Cache-Control", "no-store");
    res.json({ count: Number.isSafeInteger(stats.count) && stats.count >= 0 ? stats.count : 0, visible: stats.visible !== false });
  } catch (error) { next(error); }
});

router.post("/visit", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const current = readStats(row);
    const count = Number.isSafeInteger(current.count) && current.count >= 0 ? current.count : 0;
    const stats = { count: count + 1, visible: current.visible !== false };
    await writeStats(stats);
    res.set("Cache-Control", "no-store");
    res.status(200).json({ count: stats.count, visible: stats.visible });
  } catch (error) { next(error); }
});

router.use(authenticateToken, requireAdmin);

router.get("/admin", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const stats = readStats(row);
    res.json({ count: Number.isSafeInteger(stats.count) && stats.count >= 0 ? stats.count : 0, visible: stats.visible !== false });
  } catch (error) { next(error); }
});

router.put("/admin", async (req, res, next) => {
  try {
    if (typeof req.body.visible !== "boolean") return res.status(400).json({ message: "Choose whether the visitor count should be visible." });
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const current = readStats(row);
    const stats = { count: Number.isSafeInteger(current.count) && current.count >= 0 ? current.count : 0, visible: req.body.visible };
    await writeStats(stats);
    res.json({ message: stats.visible ? "Visitor count is now visible on the website." : "Visitor count is hidden from visitors.", ...stats });
  } catch (error) { next(error); }
});

router.post("/admin/reset", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const current = readStats(row);
    const stats = { count: 0, visible: current.visible !== false };
    await writeStats(stats);
    res.json({ message: "Visitor count has been reset to zero.", ...stats });
  } catch (error) { next(error); }
});

module.exports = router;
