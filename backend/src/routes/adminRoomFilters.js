const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const router = express.Router();
router.use(authenticateToken, requireAdmin);

const groupSchema = z.object({
  title: z.string().trim().min(1).max(120),
  icon: z.string().trim().min(1).max(60).default("bi-sliders"),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().default(true)
});
const filterSchema = z.object({
  groupId: z.string().uuid(),
  label: z.string().trim().min(1).max(160),
  filterType: z.enum(["type", "rating", "amenity", "distance", "room", "keyword"]),
  value: z.string().trim().min(1).max(160),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().default(true)
});

router.get("/", async (req, res, next) => {
  try {
    const groups = await prisma.roomFilterGroup.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: { filters: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] } }
    });
    res.json({ groups });
  } catch (error) { next(error); }
});

router.post("/groups", async (req, res, next) => {
  try {
    const parsed = groupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a valid subheading." });
    const group = await prisma.roomFilterGroup.create({ data: parsed.data });
    res.status(201).json({ group });
  } catch (error) { next(error); }
});

router.patch("/groups/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    const parsed = groupSchema.partial().safeParse(req.body);
    if (!id.success || !parsed.success || !Object.keys(parsed.data).length) return res.status(400).json({ message: "Enter valid subheading details." });
    const group = await prisma.roomFilterGroup.update({ where: { id: id.data }, data: parsed.data });
    res.json({ group });
  } catch (error) { next(error); }
});

router.delete("/groups/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ message: "Invalid subheading ID." });
    await prisma.roomFilterGroup.delete({ where: { id: id.data } });
    res.json({ message: "Subheading and its filters deleted." });
  } catch (error) { next(error); }
});

router.post("/filters", async (req, res, next) => {
  try {
    const parsed = filterSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Check the filter name, type, value and subheading." });
    const parent = await prisma.roomFilterGroup.findUnique({ where: { id: parsed.data.groupId }, select: { id: true } });
    if (!parent) return res.status(400).json({ message: "Create a subheading before adding filters." });
    const filter = await prisma.roomFilter.create({ data: parsed.data });
    res.status(201).json({ filter });
  } catch (error) { next(error); }
});

router.patch("/filters/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    const parsed = filterSchema.partial().safeParse(req.body);
    if (!id.success || !parsed.success || !Object.keys(parsed.data).length) return res.status(400).json({ message: "Enter valid filter details." });
    if (parsed.data.groupId) {
      const parent = await prisma.roomFilterGroup.findUnique({ where: { id: parsed.data.groupId }, select: { id: true } });
      if (!parent) return res.status(400).json({ message: "Choose an existing subheading." });
    }
    const filter = await prisma.roomFilter.update({ where: { id: id.data }, data: parsed.data });
    res.json({ filter });
  } catch (error) { next(error); }
});

router.delete("/filters/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ message: "Invalid filter ID." });
    await prisma.roomFilter.delete({ where: { id: id.data } });
    res.json({ message: "Filter deleted." });
  } catch (error) { next(error); }
});

module.exports = router;
