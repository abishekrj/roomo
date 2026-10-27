const express = require("express");
const prisma = require("../lib/prisma");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const groups = await prisma.roomFilterGroup.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: {
        filters: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
          select: { id: true, label: true, filterType: true, value: true, sortOrder: true }
        }
      }
    });
    res.set("Cache-Control", "no-store");
    res.json({ groups });
  } catch (error) { next(error); }
});

module.exports = router;
