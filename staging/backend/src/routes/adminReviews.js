const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();
router.use(authenticateToken, requireAdmin);
const updateSchema = z.object({
  rating: z.coerce.number().min(0.5).max(5).refine(value => Number.isInteger(value * 2), "Rating must use half-star increments."),
  comment: z.string().trim().min(10).max(2000),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});
const includeReview = { guest: { select: { id: true, fullName: true, email: true } }, property: { select: { id: true, title: true, city: true, state: true } } };

router.get("/", async (_req, res, next) => {
  try {
    const reviews = await prisma.propertyReview.findMany({ include: includeReview, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
    res.set("Cache-Control", "no-store");
    res.json({ reviews });
  } catch (error) { next(error); }
});
router.patch("/:id", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const parsed = updateSchema.safeParse(req.body);
  if (!id.success || !parsed.success) return res.status(400).json({ message: "Check the review rating, text and approval status." });
  try {
    const existing = await prisma.propertyReview.findUnique({ where: { id: id.data }, select: { id: true } });
    if (!existing) return res.status(404).json({ message: "Review not found." });
    const review = await prisma.propertyReview.update({ where: { id: id.data }, data: parsed.data, include: includeReview });
    res.json({ message: parsed.data.status === "APPROVED" ? "Review approved and published." : "Review updated.", review });
  } catch (error) { next(error); }
});
router.delete("/:id", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ message: "Invalid review ID." });
  try {
    await prisma.propertyReview.delete({ where: { id: id.data } });
    res.json({ message: "Review deleted." });
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Review not found." });
    next(error);
  }
});
module.exports = router;
