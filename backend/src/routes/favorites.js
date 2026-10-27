const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateGuest = require("../middleware/authenticateGuest");

const router = express.Router();

const propertyIdSchema = z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/);
const snapshotSchema = z.object({
  id: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().max(100).optional().default("Sanctuary stay"),
  location: z.string().trim().max(500).optional().default(""),
  rating: z.coerce.number().min(0).max(5).optional().default(0),
  reviews: z.coerce.number().int().min(0).max(10000000).optional().default(0),
  price: z.coerce.number().min(0).max(100000000).optional().default(0),
  img: z.string().url().max(2048),
  desc: z.string().max(5000).optional().default(""),
  amenities: z.array(z.string().max(100)).max(50).optional().default([]),
  perks: z.array(z.string().max(200)).max(50).optional().default([]),
});

router.get("/", authenticateGuest, async (req, res, next) => {
  try {
    const favorites = await prisma.guestFavorite.findMany({
      where: { guestId: req.guest.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, propertyId: true, propertySnapshot: true, createdAt: true },
    });
    res.json({ favorites });
  } catch (error) {
    next(error);
  }
});

router.put("/:propertyId", authenticateGuest, async (req, res, next) => {
  const parsedId = propertyIdSchema.safeParse(req.params.propertyId);
  const parsedSnapshot = snapshotSchema.safeParse(req.body?.propertySnapshot);
  if (!parsedId.success || !parsedSnapshot.success || parsedSnapshot.data.id !== parsedId.data) {
    return res.status(400).json({ message: "The selected stay details are invalid. Please refresh the listings and try again." });
  }

  try {
    const favorite = await prisma.guestFavorite.upsert({
      where: { guestId_propertyId: { guestId: req.guest.id, propertyId: parsedId.data } },
      create: {
        guestId: req.guest.id,
        propertyId: parsedId.data,
        propertySnapshot: parsedSnapshot.data,
      },
      update: { propertySnapshot: parsedSnapshot.data },
      select: { id: true, propertyId: true, propertySnapshot: true, createdAt: true },
    });
    res.json({ message: "Stay added to your favourites.", favorite });
  } catch (error) {
    next(error);
  }
});

router.delete("/:propertyId", authenticateGuest, async (req, res, next) => {
  const parsedId = propertyIdSchema.safeParse(req.params.propertyId);
  if (!parsedId.success) return res.status(400).json({ message: "Invalid stay ID." });
  try {
    await prisma.guestFavorite.deleteMany({
      where: { guestId: req.guest.id, propertyId: parsedId.data },
    });
    res.json({ message: "Stay removed from your favourites." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
