const express = require("express");
const crypto = require("crypto");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateGuest = require("../middleware/authenticateGuest");

const router = express.Router();

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const searchSchema = z.object({
  propertyId: z.string().uuid(),
  checkIn: z.string().regex(datePattern),
  checkOut: z.string().regex(datePattern),
  adults: z.coerce.number().int().min(1).max(100).default(2),
  children: z.coerce.number().int().min(0).max(100).default(0),
  rooms: z.coerce.number().int().min(1).max(100).default(1),
});
const reservationSchema = searchSchema.extend({
  specialRequests: z.string().trim().max(1000).optional().default(""),
});

function parseDate(value) {
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function nightsBetween(checkIn, checkOut) {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
}

function reservationCode() {
  return "RM-" + crypto.randomBytes(5).toString("hex").toUpperCase();
}

function overlappingWhere(propertyId, checkIn, checkOut) {
  return {
    propertyId,
    checkIn: { lt: checkOut },
    checkOut: { gt: checkIn },
    status: { in: ["REQUESTED", "CONFIRMED"] },
  };
}

async function getAvailability(client, input) {
  const checkIn = parseDate(input.checkIn);
  const checkOut = parseDate(input.checkOut);
  if (!checkIn || !checkOut) return { error: "Enter valid check-in and check-out dates." };
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (checkIn < today) return { error: "Check-in cannot be in the past." };
  if (checkOut <= checkIn) return { error: "Check-out must be after check-in." };

  const property = await client.property.findFirst({
    where: { id: input.propertyId, status: "PUBLISHED" },
    select: { id: true, title: true, nightlyPrice: true, maxGuests: true, totalUnits: true, city: true },
  });
  if (!property) return { notFound: true };
  if (input.adults + input.children > property.maxGuests * input.rooms) {
    return { error: `This property accommodates up to ${property.maxGuests} guest(s) per unit. Choose more rooms or fewer guests.` };
  }

  const bookings = await client.reservation.aggregate({
    where: overlappingWhere(property.id, checkIn, checkOut),
    _sum: { roomCount: true },
  });
  const reservedUnits = bookings._sum.roomCount || 0;
  const availableUnits = Math.max(0, property.totalUnits - reservedUnits);
  const nights = nightsBetween(checkIn, checkOut);
  const nightlyPrice = Number(property.nightlyPrice);
  return {
    property: { id: property.id, title: property.title, city: property.city, maxGuests: property.maxGuests, totalUnits: property.totalUnits },
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights,
    adults: input.adults,
    children: input.children,
    roomsRequested: input.rooms,
    availableUnits,
    available: availableUnits >= input.rooms,
    nightlyPrice,
    totalAmount: Math.round(nightlyPrice * nights * input.rooms * 100) / 100,
    currency: "INR",
  };
}

// GET /api/reservations/availability — public search against current reservation inventory.
router.get("/availability", async (req, res, next) => {
  try {
    const parsed = searchSchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ message: "Please provide a property, valid dates, guests, and rooms." });
    const result = await getAvailability(prisma, parsed.data);
    if (result.notFound) return res.status(404).json({ message: "This property is not available for booking." });
    if (result.error) return res.status(400).json({ message: result.error });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/reservations — creates a guest reservation request after rechecking inventory.
router.post("/", authenticateGuest, async (req, res, next) => {
  const parsed = reservationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Please check your reservation details." });

  try {
    const input = parsed.data;
    const checkIn = parseDate(input.checkIn);
    const checkOut = parseDate(input.checkOut);
    if (!checkIn || !checkOut) return res.status(400).json({ message: "Enter valid check-in and check-out dates." });

    const result = await prisma.$transaction(async (tx) => {
      // Lock the property row so concurrent requests cannot both claim the last unit.
      const locked = await tx.$queryRaw`SELECT id FROM properties WHERE id = ${input.propertyId}::uuid AND status = 'PUBLISHED'::"PropertyStatus" FOR UPDATE`;
      if (!locked.length) return { notFound: true };

      const availability = await getAvailability(tx, input);
      if (availability.notFound || availability.error) return availability;
      if (!availability.available) return { unavailable: true, availability };

      const created = await tx.reservation.create({
        data: {
          reservationCode: reservationCode(),
          guestId: req.guest.id,
          propertyId: input.propertyId,
          checkIn,
          checkOut,
          adults: input.adults,
          children: input.children,
          roomCount: input.rooms,
          nights: availability.nights,
          nightlyPrice: availability.nightlyPrice,
          totalAmount: availability.totalAmount,
          status: "REQUESTED",
          specialRequests: input.specialRequests || null,
        },
        include: {
          property: { select: { id: true, title: true, city: true, address: true } },
        },
      });
      return { reservation: created };
    }, { isolationLevel: "Serializable", maxWait: 5000, timeout: 10000 });

    if (result.notFound) return res.status(404).json({ message: "This property is not available for booking." });
    if (result.error) return res.status(400).json({ message: result.error });
    if (result.unavailable) return res.status(409).json({ message: "Those dates no longer have enough units available. Please update your search.", availability: result.availability });
    if (result.reservation) return res.status(201).json({ message: "Reservation request created. The property still needs to confirm it.", reservation: result.reservation });
    return res.status(400).json({ message: "Unable to create this reservation." });
  } catch (error) {
    if (error.code === "P2034") return res.status(409).json({ message: "Another booking was being processed for those dates. Please check availability and try again." });
    if (error.code === "P2002") return res.status(409).json({ message: "Please retry your reservation." });
    next(error);
  }
});

// GET /api/reservations/mine — the signed-in guest's reservations only.
router.get("/mine", authenticateGuest, async (req, res, next) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { guestId: req.guest.id },
      include: { property: { select: { id: true, title: true, city: true, address: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ reservations });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/reservations/:id/cancel — guests may cancel their own pending/confirmed reservation.
router.patch("/:id/cancel", authenticateGuest, async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ message: "Invalid reservation ID." });
  try {
    const existing = await prisma.reservation.findFirst({ where: { id: id.data, guestId: req.guest.id } });
    if (!existing) return res.status(404).json({ message: "Reservation not found." });
    if (existing.status === "CANCELLED") return res.status(409).json({ message: "This reservation is already cancelled." });
    if (existing.checkIn <= new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z")) {
      return res.status(400).json({ message: "Reservations cannot be cancelled on or after check-in. Please contact ROOMO support." });
    }
    const reservation = await prisma.reservation.update({
      where: { id: existing.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    res.json({ message: "Reservation cancelled.", reservation });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
