const express = require("express");
const prisma = require("../lib/prisma");
const defaults = require("../lib/homepageDefaults");
const router = express.Router();

const defaultPlaces = [
  {
    "id": "annamalaiyar-temple",
    "name": "Annamalaiyar Temple"
  },
  {
    "id": "sri-ramanasramam",
    "name": "Sri Ramanasramam"
  },
  {
    "id": "girivalam-path",
    "name": "Girivalam Path"
  },
  {
    "id": "arunachala-hill",
    "name": "Arunachala Hill"
  },
  {
    "id": "skandashramam",
    "name": "Skandashramam"
  },
  {
    "id": "virupaksha-cave",
    "name": "Virupaksha Cave"
  },
  {
    "id": "seshadri-swamigal-ashram",
    "name": "Seshadri Swamigal Ashram"
  },
  {
    "id": "yogi-ramsuratkumar-ashram",
    "name": "Yogi Ramsuratkumar Ashram"
  },
  {
    "id": "adi-annamalai-temple",
    "name": "Adi Annamalai Temple"
  },
  {
    "id": "central-bus-stand",
    "name": "Tiruvannamalai Central Bus Stand"
  },
  {
    "id": "railway-station",
    "name": "Tiruvannamalai Railway Station"
  }
];
router.get("/destinations", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const places = row?.published?.destinationPlaces || row?.draft?.destinationPlaces || defaultPlaces;
    res.set("Cache-Control", "no-store");
    res.json({ places });
  } catch (error) { next(error); }
});

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
