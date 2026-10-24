const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();
const enquiryInput = z.object({
  propertyId: z.string().uuid(),
  guestName: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(5).max(32),
  checkIn: z.string().date().nullable().optional(),
  checkOut: z.string().date().nullable().optional(),
  adults: z.coerce.number().int().min(1).max(30).default(2),
  rooms: z.coerce.number().int().min(1).max(20).default(1),
  message: z.string().trim().max(3000).optional().default("")
}).superRefine((data, ctx) => {
  if (data.checkIn && data.checkOut && data.checkOut <= data.checkIn) {
    ctx.addIssue({ code: "custom", path: ["checkOut"], message: "Check-out must be after check-in." });
  }
});

// Public guest submission. An enquiry is not a reservation or booking confirmation.
router.post("/", async (req, res, next) => {
  const parsed = enquiryInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message || "Please check your enquiry details." });
  }
  try {
    const data = parsed.data;
    const property = await prisma.property.findFirst({
      where: { id: data.propertyId, status: "PUBLISHED" },
      select: { id: true }
    });
    if (!property) return res.status(404).json({ message: "This property is not available for enquiries." });

    const enquiry = await prisma.enquiry.create({
      data: {
        propertyId: property.id,
        guestName: data.guestName || data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        checkIn: data.checkIn ? new Date(data.checkIn + "T00:00:00.000Z") : null,
        checkOut: data.checkOut ? new Date(data.checkOut + "T00:00:00.000Z") : null,
        adults: data.adults,
        rooms: data.rooms,
        message: data.message
      },
      select: { id: true, createdAt: true }
    });
    res.status(201).json({ message: "Your enquiry has been sent to the property owner and ROOMO team.", enquiryId: enquiry.id, createdAt: enquiry.createdAt });
  } catch (error) { next(error); }
});

// Owners can only view enquiries for properties assigned to their account.
router.get("/owner", authenticateToken, async (req, res, next) => {
  try {
    const owner = await prisma.owner.findUnique({ where: { id: req.owner.sub }, select: { id: true, role: true } });
    if (!owner || owner.role !== "OWNER") return res.status(403).json({ message: "Owner account required." });
    const enquiries = await prisma.enquiry.findMany({
      where: { property: { ownerId: owner.id } },
      include: { property: { select: { id: true, title: true, city: true, address: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({ enquiries });
  } catch (error) { next(error); }
});

// Super Admin can view every submitted enquiry and its property owner.
router.get("/admin", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      include: { property: { select: { id: true, title: true, city: true, state: true, owner: { select: { id: true, fullName: true, email: true, phoneNumber: true } } } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({ enquiries, total: enquiries.length });
  } catch (error) { next(error); }
});

module.exports = router;
