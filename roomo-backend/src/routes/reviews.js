const express = require("express");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const prisma = require("../lib/prisma");

const router = express.Router();
const reviewSchema = z.object({
  propertyId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000),
});

function guestToken(req) {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
  const cookie = (req.headers.cookie || "").split(";").map(part => part.trim()).find(part => part.startsWith("roomo_guest_session="));
  return cookie ? decodeURIComponent(cookie.slice("roomo_guest_session=".length)) : null;
}
async function authenticatedGuest(req, res) {
  const token = guestToken(req);
  if (!token) { res.status(401).json({ message: "Please sign in to write a review." }); return null; }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: "roomo-api", audience: "roomo-guest" });
    const guest = await prisma.guestUser.findUnique({ where: { id: decoded.sub }, select: { id: true, fullName: true, emailVerified: true } });
    if (!guest || !guest.emailVerified) { res.status(401).json({ message: "Please sign in with a verified guest account to write a review." }); return null; }
    return guest;
  } catch {
    res.status(401).json({ message: "Your session has expired. Please sign in again." });
    return null;
  }
}
function reviewPayload(review) {
  return { id: review.id, rating: review.rating, comment: review.comment, guestName: review.guest?.fullName || "ROOMO guest", createdAt: review.createdAt, updatedAt: review.updatedAt, status: review.status };
}

// Public reviews are only those approved by a Super Admin.
router.get("/property/:propertyId", async (req, res, next) => {
  const parsedId = z.string().uuid().safeParse(req.params.propertyId);
  if (!parsedId.success) return res.status(400).json({ message: "Invalid property ID." });
  try {
    const property = await prisma.property.findFirst({ where: { id: parsedId.data, status: "PUBLISHED" }, select: { id: true } });
    if (!property) return res.status(404).json({ message: "Stay not found." });
    const reviews = await prisma.propertyReview.findMany({
      where: { propertyId: property.id, status: "APPROVED" },
      include: { guest: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
    const rating = reviews.length ? Math.round((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length) * 10) / 10 : null;
    res.set("Cache-Control", "no-store");
    res.json({ reviews: reviews.map(reviewPayload), rating, reviewCount: reviews.length });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  const guest = await authenticatedGuest(req, res);
  if (!guest) return;
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Choose a star rating and write a review between 10 and 2,000 characters." });
  try {
    const property = await prisma.property.findFirst({ where: { id: parsed.data.propertyId, status: "PUBLISHED" }, select: { id: true, title: true } });
    if (!property) return res.status(404).json({ message: "This stay is not currently available for review." });
    const review = await prisma.propertyReview.create({
      data: { propertyId: property.id, guestId: guest.id, rating: parsed.data.rating, comment: parsed.data.comment, status: "PENDING" },
      include: { guest: { select: { fullName: true } } },
    });
    res.status(201).json({ message: "Thank you! Your review has been sent to ROOMO for approval. It will appear publicly after it is approved.", review: reviewPayload(review) });
  } catch (error) { next(error); }
});
module.exports = router;
