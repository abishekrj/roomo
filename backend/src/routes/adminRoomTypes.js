const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();
router.use(authenticateToken, requireAdmin);

const roomTypeSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5000).optional().default(""),
  nightlyPrice: z.coerce.number().positive().finite().max(10000000),
  maxGuests: z.coerce.number().int().min(1).max(100).default(2),
  quantity: z.coerce.number().int().min(0).max(10000).default(1),
  bedConfiguration: z.array(z.object({
    type: z.string().trim().min(1).max(80),
    count: z.coerce.number().int().min(1).max(50)
  })).max(20).default([]),
  facilities: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
  imageUrls: z.array(z.string().url().max(2048)).max(10).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0)
});

const updateSchema = roomTypeSchema.omit({ propertyId: true }).partial();

function toData(data) {
  return {
    ...data,
    nightlyPrice: data.nightlyPrice,
    bedConfiguration: data.bedConfiguration,
    facilities: data.facilities,
    imageUrls: data.imageUrls
  };
}

// Property list is intentionally limited to fields needed by the room-type manager.
router.get("/properties", async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      orderBy: [{ title: "asc" }],
      select: { id: true, title: true, city: true, state: true, status: true }
    });
    res.json({ properties });
  } catch (error) { next(error); }
});

router.get("/", async (req, res, next) => {
  try {
    const propertyId = z.string().uuid().safeParse(req.query.propertyId);
    if (!propertyId.success) return res.status(400).json({ message: "Choose a property to view its room types." });
    const property = await prisma.property.findUnique({
      where: { id: propertyId.data },
      select: { id: true, title: true, city: true, state: true }
    });
    if (!property) return res.status(404).json({ message: "Property not found." });
    const roomTypes = await prisma.roomType.findMany({
      where: { propertyId: property.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });
    res.json({ property, roomTypes });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  const parsed = roomTypeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Please check the room type details.", errors: parsed.error.issues.map(i => ({ field: i.path.join("."), message: i.message })) });
  try {
    const data = parsed.data;
    const property = await prisma.property.findUnique({ where: { id: data.propertyId }, select: { id: true } });
    if (!property) return res.status(404).json({ message: "Select an existing property." });
    const roomType = await prisma.roomType.create({ data: toData(data) });
    res.status(201).json({ message: "Room type created successfully.", roomType });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "This property already has a room type with that name." });
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const parsed = updateSchema.safeParse(req.body);
  if (!id.success) return res.status(400).json({ message: "Invalid room type ID." });
  if (!parsed.success || !Object.keys(parsed.data || {}).length) return res.status(400).json({ message: "Please provide valid room type details." });
  try {
    const existing = await prisma.roomType.findUnique({ where: { id: id.data }, select: { id: true } });
    if (!existing) return res.status(404).json({ message: "Room type not found." });
    const roomType = await prisma.roomType.update({ where: { id: id.data }, data: parsed.data });
    res.json({ message: "Room type updated successfully.", roomType });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "This property already has a room type with that name." });
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ message: "Invalid room type ID." });
  try {
    const existing = await prisma.roomType.findUnique({ where: { id: id.data }, select: { id: true } });
    if (!existing) return res.status(404).json({ message: "Room type not found." });
    await prisma.roomType.delete({ where: { id: id.data } });
    res.json({ message: "Room type deleted. Existing reservations will retain their property and booking details." });
  } catch (error) { next(error); }
});

module.exports = router;
