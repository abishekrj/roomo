const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const { GUEST_COOKIE, parseCookies } = require("../lib/sessionCookies");

const router = express.Router();
let webpush = null;
try { webpush = require("web-push"); } catch { /* Install web-push in roomo-backend to enable browser push delivery. */ }
if (webpush && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@roomo.in", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

async function guestAuth(req, res, next) {
  const cookies = parseCookies(req);
  const authorization = req.headers.authorization;
  const token = cookies[GUEST_COOKIE] || (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null);
  if (!token) return res.status(401).json({ message: "Please sign in to request a driver." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: "roomo-api", audience: "roomo-guest", algorithms: ["HS256"] });
    if (decoded.role !== "GUEST") return res.status(403).json({ message: "Guest account access is required." });
    const user = await prisma.guestUser.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.emailVerified) return res.status(401).json({ message: "Please verify your ROOMO account email and sign in again." });
    req.guestUser = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError" || error.name === "NotBeforeError") return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    next(error);
  }
}

function driverAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Driver sign-in required." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: "roomo-api", audience: "roomo-driver" });
    if (decoded.type !== "DRIVER") return res.status(403).json({ message: "Driver access required." });
    req.driver = decoded;
    next();
  } catch { return res.status(401).json({ message: "Driver session expired. Please sign in again." }); }
}
const driverFields = {
  id: true, fullName: true, email: true, phoneNumber: true, licenseNumber: true,
  vehicleType: true, vehicleMake: true, vehicleModel: true, vehicleNumber: true,
  passengerCapacity: true, serviceAreas: true, notes: true, isActive: true, isAvailable: true,
  createdAt: true, updatedAt: true
};
const driverSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phoneNumber: z.string().trim().min(7).max(32),
  password: z.string().min(12).max(72),
  licenseNumber: z.string().trim().max(80).optional().or(z.literal("")),
  vehicleType: z.enum(["CAR", "VAN", "SUV", "TEMPO_TRAVELLER"]),
  vehicleMake: z.string().trim().max(80).optional().or(z.literal("")),
  vehicleModel: z.string().trim().max(80).optional().or(z.literal("")),
  vehicleNumber: z.string().trim().min(3).max(30),
  passengerCapacity: z.coerce.number().int().min(1).max(30),
  serviceAreas: z.array(z.string().trim().min(2).max(100)).max(30).default([]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  isAvailable: z.boolean().default(true)
});
const bookingSchema = z.object({
  guestName: z.string().trim().min(2).max(120),
  guestPhone: z.string().trim().min(7).max(32),
  guestEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
  pickupLocation: z.string().trim().min(3).max(500),
  dropoffLocation: z.string().trim().min(3).max(500),
  travelAt: z.string().datetime({ offset: true }),
  passengerCount: z.coerce.number().int().min(1).max(30),
  vehicleType: z.enum(["CAR", "VAN", "SUV", "TEMPO_TRAVELLER"]),
  notes: z.string().trim().max(1000).optional().or(z.literal(""))
});
async function sendDriverPush(driverId, payload) {
  if (!webpush || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
  const subscriptions = await prisma.driverPushSubscription.findMany({ where: { driverId } });
  await Promise.all(subscriptions.map(async subscription => {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify(payload), { TTL: 120 });
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) await prisma.driverPushSubscription.deleteMany({ where: { id: subscription.id } });
      else console.error("Driver push delivery failed:", error.statusCode || error.message);
    }
  }));
}
async function dispatchBooking(booking) {
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
  const candidates = await prisma.driver.findMany({
    where: { isActive: true, isAvailable: true, vehicleType: booking.vehicleType, passengerCapacity: { gte: booking.passengerCount } },
    select: { id: true, serviceAreas: true }
  });
  const eligible = candidates.filter(driver => {
    const configured = Array.isArray(driver.serviceAreas) ? driver.serviceAreas : [];
    return configured.length === 0 || configured.some(area => (booking.pickupLocation + " " + booking.dropoffLocation).toLowerCase().includes(String(area).toLowerCase()));
  });
  if (!eligible.length) return;
  const dispatched = await prisma.$transaction(async tx => {
    const stillPending = await tx.transportBooking.updateMany({
      where: { id: booking.id, status: "PENDING", assignedDriverId: null },
      data: { dispatchExpiresAt: expiresAt }
    });
    if (stillPending.count !== 1) return false;
    await tx.driverOffer.createMany({ data: eligible.map(driver => ({ bookingId: booking.id, driverId: driver.id, expiresAt })), skipDuplicates: true });
    return true;
  });
  if (!dispatched) return;
  await Promise.all(eligible.map(driver => sendDriverPush(driver.id, {
    title: "ROOMO · New trip request",
    body: booking.pickupLocation + " → " + booking.dropoffLocation,
    url: "/driver/dashboard",
    bookingCode: booking.bookingCode
  })));
}

router.post("/bookings", guestAuth, async (req, res, next) => {
  try {
    const parsed = bookingSchema.safeParse({
      ...req.body,
      guestName: req.guestUser.fullName,
      guestEmail: req.guestUser.email,
      guestPhone: req.body?.guestPhone || req.guestUser.phoneNumber || ""
    });
    if (!parsed.success) return res.status(400).json({ message: "Please check the trip details. Add a valid mobile number to your profile or booking request.", errors: parsed.error.flatten().fieldErrors });
    const data = parsed.data;
    if (new Date(data.travelAt) <= new Date()) return res.status(400).json({ message: "Choose a future pickup date and time." });
    const booking = await prisma.transportBooking.create({
      data: { ...data, guestUserId: req.guestUser.id, guestEmail: req.guestUser.email, notes: data.notes || null, bookingCode: "TR" + crypto.randomBytes(4).toString("hex").toUpperCase() }
    });
    dispatchBooking(booking).catch(error => console.error("Transport dispatch failed:", error.message));
    res.status(201).json({ message: "Your transport request has been received. ROOMO is notifying eligible drivers.", booking: { id: booking.id, bookingCode: booking.bookingCode, status: booking.status } });
  } catch (error) { next(error); }
});

router.get("/my-bookings", guestAuth, async (req, res, next) => {
  try {
    const bookings = await prisma.transportBooking.findMany({
      where: { guestUserId: req.guestUser.id },
      include: { assignedDriver: { select: { fullName: true, phoneNumber: true, vehicleType: true, vehicleNumber: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({ bookings });
  } catch (error) { next(error); }
});

router.post("/driver/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password || password.length > 72) return res.status(400).json({ message: "Enter your driver email and password." });
    const driver = await prisma.driver.findUnique({ where: { email } });
    if (!driver || !driver.isActive || !(await bcrypt.compare(password, driver.passwordHash))) return res.status(401).json({ message: "Invalid driver email or password." });
    const token = jwt.sign({ sub: driver.id, type: "DRIVER" }, process.env.JWT_SECRET, { expiresIn: "7d", issuer: "roomo-api", audience: "roomo-driver" });
    res.json({ token, driver: { id: driver.id, fullName: driver.fullName, email: driver.email, vehicleType: driver.vehicleType, vehicleNumber: driver.vehicleNumber } });
  } catch (error) { next(error); }
});
router.get("/driver/me", driverAuth, async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({ where: { id: req.driver.sub, isActive: true }, select: driverFields });
    if (!driver) return res.status(401).json({ message: "Driver account is inactive." });
    res.json({ driver });
  } catch (error) { next(error); }
});
router.get("/driver/requests", driverAuth, async (req, res, next) => {
  try {
    const offers = await prisma.driverOffer.findMany({
      where: { driverId: req.driver.sub, status: "OFFERED", expiresAt: { gt: new Date() }, booking: { status: "PENDING" } },
      include: { booking: true }, orderBy: { offeredAt: "desc" }
    });
    const assigned = await prisma.transportBooking.findMany({
      where: { assignedDriverId: req.driver.sub, status: { in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"] } },
      orderBy: { travelAt: "asc" }
    });
    res.json({ requests: offers.map(offer => ({ offerId: offer.id, expiresAt: offer.expiresAt, booking: offer.booking })), assigned });
  } catch (error) { next(error); }
});
router.post("/driver/push-subscriptions", driverAuth, async (req, res, next) => {
  try {
    const subscription = req.body?.subscription;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) return res.status(400).json({ message: "A valid browser push subscription is required." });
    await prisma.driverPushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: { driverId: req.driver.sub, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, userAgent: String(req.headers["user-agent"] || "").slice(0, 500) },
      update: { driverId: req.driver.sub, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, userAgent: String(req.headers["user-agent"] || "").slice(0, 500) }
    });
    res.status(201).json({ message: "Push notifications enabled for this device." });
  } catch (error) { next(error); }
});
router.post("/driver/requests/:offerId/decline", driverAuth, async (req, res, next) => {
  try {
    const offer = await prisma.driverOffer.findFirst({ where: { id: req.params.offerId, driverId: req.driver.sub, status: "OFFERED" } });
    if (!offer) return res.status(404).json({ message: "This trip request is no longer available." });
    await prisma.driverOffer.update({ where: { id: offer.id }, data: { status: "DECLINED", respondedAt: new Date() } });
    res.json({ message: "Trip request declined." });
  } catch (error) { next(error); }
});
router.post("/driver/requests/:offerId/accept", driverAuth, async (req, res, next) => {
  try {
    const offer = await prisma.driverOffer.findFirst({
      where: { id: req.params.offerId, driverId: req.driver.sub, status: "OFFERED", expiresAt: { gt: new Date() }, booking: { status: "PENDING" } },
      include: { booking: true, driver: true }
    });
    if (!offer) return res.status(409).json({ message: "This trip request has expired or has already been assigned." });
    const booking = offer.booking;
    if (!offer.driver.isActive || !offer.driver.isAvailable || offer.driver.passengerCapacity < booking.passengerCount || offer.driver.vehicleType !== booking.vehicleType) return res.status(409).json({ message: "You are no longer eligible for this trip." });
    const tripStart = new Date(booking.travelAt);
    const tripEnd = new Date(tripStart.getTime() + 3 * 60 * 60 * 1000);
    const conflict = await prisma.transportBooking.findFirst({
      where: { assignedDriverId: offer.driverId, status: { in: ["CONFIRMED", "IN_PROGRESS"] }, travelAt: { lt: tripEnd, gte: new Date(tripStart.getTime() - 3 * 60 * 60 * 1000) } }
    });
    if (conflict) return res.status(409).json({ message: "You already have a trip scheduled around this time." });
    const assignment = await prisma.$transaction(async tx => {
      const lockedDriver = await tx.driver.updateMany({
        where: { id: offer.driverId, isActive: true, isAvailable: true },
        data: { isAvailable: false }
      });
      if (lockedDriver.count !== 1) return { ok: false, message: "Another trip has just been assigned to you. Refresh your requests." };
      const overlappingTrip = await tx.transportBooking.findFirst({
        where: {
          assignedDriverId: offer.driverId,
          status: { in: ["CONFIRMED", "IN_PROGRESS"] },
          travelAt: { lt: tripEnd, gte: new Date(tripStart.getTime() - 3 * 60 * 60 * 1000) }
        }
      });
      if (overlappingTrip) {
        await tx.driver.update({ where: { id: offer.driverId }, data: { isAvailable: true } });
        return { ok: false, message: "You already have a trip scheduled around this time." };
      }
      const claimed = await tx.transportBooking.updateMany({
        where: { id: booking.id, status: "PENDING", assignedDriverId: null, dispatchExpiresAt: { gt: new Date() } },
        data: { status: "CONFIRMED", assignedDriverId: offer.driverId, assignedAt: new Date() }
      });
      if (claimed.count !== 1) {
        await tx.driver.update({ where: { id: offer.driverId }, data: { isAvailable: true } });
        return { ok: false, message: "Another driver has already accepted this trip." };
      }
      await tx.driverOffer.update({ where: { id: offer.id }, data: { status: "ACCEPTED", respondedAt: new Date() } });
      await tx.driverOffer.updateMany({ where: { bookingId: booking.id, id: { not: offer.id }, status: "OFFERED" }, data: { status: "UNAVAILABLE", respondedAt: new Date() } });
      return { ok: true };
    });
    if (!assignment.ok) return res.status(409).json({ message: assignment.message });
    res.json({ message: "Trip confirmed. You are assigned as the driver.", booking: { ...booking, status: "CONFIRMED", assignedDriverId: offer.driverId } });
  } catch (error) { next(error); }
});

const adminRouter = express.Router();
adminRouter.use(authenticateToken, requireAdmin);
adminRouter.get("/drivers", async (req, res, next) => {
  try {
    const drivers = await prisma.driver.findMany({ select: driverFields, orderBy: { createdAt: "desc" } });
    res.json({ drivers });
  } catch (error) { next(error); }
});
adminRouter.post("/drivers", async (req, res, next) => {
  try {
    const parsed = driverSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please check the driver details.", errors: parsed.error.flatten().fieldErrors });
    const data = parsed.data;
    const { password, ...driverData } = data;
    const driver = await prisma.driver.create({
      data: {
        ...driverData, email: data.email.toLowerCase(), phoneNumber: data.phoneNumber.trim(),
        passwordHash: await bcrypt.hash(password, 12),
        licenseNumber: data.licenseNumber || null, vehicleMake: data.vehicleMake || null,
        vehicleModel: data.vehicleModel || null, notes: data.notes || null
      },
      select: driverFields
    });
    res.status(201).json({ message: "Driver created successfully.", driver });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "A driver with this email or phone number already exists." });
    next(error);
  }
});
adminRouter.patch("/drivers/:id/status", async (req, res, next) => {
  try {
    const driver = await prisma.driver.update({ where: { id: req.params.id }, data: { isActive: Boolean(req.body?.isActive), isAvailable: Boolean(req.body?.isAvailable) }, select: driverFields });
    res.json({ driver });
  } catch (error) { next(error); }
});
adminRouter.get("/bookings", async (req, res, next) => {
  try {
    const bookings = await prisma.transportBooking.findMany({
      include: { assignedDriver: { select: { id: true, fullName: true, phoneNumber: true, vehicleType: true, vehicleNumber: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({ bookings });
  } catch (error) { next(error); }
});
adminRouter.patch("/bookings/:id/assign", async (req, res, next) => {
  try {
    const driverId = String(req.body?.driverId || "");
    const [booking, driver] = await Promise.all([
      prisma.transportBooking.findUnique({ where: { id: req.params.id } }),
      prisma.driver.findUnique({ where: { id: driverId } })
    ]);
    if (!booking) return res.status(404).json({ message: "Transport booking not found." });
    if (!driver || !driver.isActive || driver.vehicleType !== booking.vehicleType || driver.passengerCapacity < booking.passengerCount || (!driver.isAvailable && booking.assignedDriverId !== driver.id)) return res.status(400).json({ message: "Choose an active, available driver with a suitable vehicle and capacity." });
    const result = await prisma.$transaction(async tx => {
      const current = await tx.transportBooking.findUnique({ where: { id: booking.id } });
      if (!current || !["PENDING", "CONFIRMED"].includes(current.status)) return false;
      if (current.assignedDriverId && current.assignedDriverId !== driver.id) {
        await tx.driver.update({ where: { id: current.assignedDriverId }, data: { isAvailable: true } });
      }
      const assigned = await tx.transportBooking.updateMany({
        where: { id: booking.id, status: { in: ["PENDING", "CONFIRMED"] } },
        data: { status: "CONFIRMED", assignedDriverId: driver.id, assignedAt: new Date() }
      });
      if (!assigned.count) return false;
      await tx.driver.update({ where: { id: driver.id }, data: { isAvailable: false } });
      await tx.driverOffer.updateMany({ where: { bookingId: booking.id, status: "OFFERED" }, data: { status: "UNAVAILABLE", respondedAt: new Date() } });
      return true;
    });
    if (!result) return res.status(409).json({ message: "This booking can no longer be assigned." });
    await sendDriverPush(driver.id, { title: "ROOMO · Trip assigned", body: booking.pickupLocation + " → " + booking.dropoffLocation, url: "/driver/dashboard", bookingCode: booking.bookingCode });
    res.json({ message: "Driver assigned successfully." });
  } catch (error) { next(error); }
});
adminRouter.patch("/bookings/:id/status", async (req, res, next) => {
  try {
    const status = String(req.body?.status || "");
    if (!["CONFIRMED", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status)) return res.status(400).json({ message: "Invalid transport booking status." });
    const booking = await prisma.transportBooking.update({ where: { id: req.params.id }, data: { status } });
    if (booking.assignedDriverId && ["COMPLETED", "CANCELLED"].includes(status)) await prisma.driver.update({ where: { id: booking.assignedDriverId }, data: { isAvailable: true } });
    if (["COMPLETED", "CANCELLED"].includes(status)) {
      await prisma.driverOffer.updateMany({ where: { bookingId: booking.id, status: "OFFERED" }, data: { status: "UNAVAILABLE", respondedAt: new Date() } });
    }
    res.json({ booking });
  } catch (error) { next(error); }
});
router.use("/admin", adminRouter);

module.exports = router;
