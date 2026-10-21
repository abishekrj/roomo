const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

const defaults = {
  showAccommodationSummary: true,
  showBedDetails: true,
  showPaymentMessage: true,
  showAvailabilityMessage: true,
  showLocation: true,
  showGuestRating: true,
  showDescription: false,
  paymentMessage: "No prepayment needed – pay at the property",
  availabilityMessageTemplate: "We have {count} left at this price"
};

const settingsSchema = z.object({
  showAccommodationSummary: z.boolean(),
  showBedDetails: z.boolean(),
  showPaymentMessage: z.boolean(),
  showAvailabilityMessage: z.boolean(),
  showLocation: z.boolean(),
  showGuestRating: z.boolean(),
  showDescription: z.boolean(),
  paymentMessage: z.string().trim().max(180),
  availabilityMessageTemplate: z.string().trim().max(180).refine(value => value.includes("{count}"), "Availability message must include {count}.")
});

router.get("/", async (req, res, next) => {
  try {
    const config = await prisma.listingDisplayConfig.findUnique({ where: { id: 1 } });
    res.json({ settings: { ...defaults, ...(config?.settings || {}) } });
  } catch (error) { next(error); }
});

router.get("/admin", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const config = await prisma.listingDisplayConfig.findUnique({ where: { id: 1 } });
    res.json({ settings: { ...defaults, ...(config?.settings || {}) } });
  } catch (error) { next(error); }
});

router.put("/admin", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please check the listing display settings.", errors: parsed.error.issues });
    const config = await prisma.listingDisplayConfig.upsert({
      where: { id: 1 },
      create: { id: 1, settings: parsed.data },
      update: { settings: parsed.data }
    });
    res.json({ message: "Listing display settings saved.", settings: { ...defaults, ...config.settings } });
  } catch (error) { next(error); }
});

module.exports = router;
