const express = require("express");
const { z } = require("zod");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const defaults = require("../lib/homepageDefaults");

const router = express.Router();
const placeSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(180),
  description: z.string().trim().max(500).default(""),
  imageUrl: z.string().trim().max(2000).refine(value => !value || /^https?:\/\//i.test(value), "Use a valid image URL.").default(""),
  mapUrl: z.string().trim().max(2000).refine(value => !value || /^https?:\/\//i.test(value), "Use a valid map URL.").default(""),
  visible: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0)
});
const placesSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(400),
  places: z.array(placeSchema).max(50)
}).superRefine((data, ctx) => {
  const ids = data.places.map(place => place.id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["places"], message: "Each nearby place must have a unique ID." });
});

const defaultConfig = {
  title: "Featured Stays",
  description: "Discover memorable places and scenic escapes to add to your sacred journey."
  places: [
    { id: "sathanur-dam", name: "Sathanur Dam", location: "Sathanur, Tiruvannamalai District, Tamil Nadu", description: "A scenic dam and reservoir surrounded by green hills and peaceful countryside.", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80", mapUrl: "https://www.google.com/maps/search/?api=1&query=Sathanur+Dam+Tamil+Nadu", visible: true, sortOrder: 1 },
    { id: "yelagiri-hills", name: "Yelagiri Hills", location: "Yelagiri, Tirupattur District, Tamil Nadu", description: "A hill retreat known for fresh air, scenic viewpoints and outdoor activities.", imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80", mapUrl: "https://www.google.com/maps/search/?api=1&query=Yelagiri+Hills+Tamil+Nadu", visible: true, sortOrder: 2 },
    { id: "parvathamalai", name: "Parvathamalai", location: "Thenmathimangalam, Tiruvannamalai District, Tamil Nadu", description: "A revered hill destination popular with devotees and experienced trekkers.", imageUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=80", mapUrl: "https://www.google.com/maps/search/?api=1&query=Parvathamalai+Tamil+Nadu", visible: true, sortOrder: 3 },
    { id: "gingee-fort", name: "Gingee Fort", location: "Gingee, Villupuram District, Tamil Nadu", description: "A remarkable historic fort complex set across dramatic rocky hilltops.", imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80", mapUrl: "https://www.google.com/maps/search/?api=1&query=Gingee+Fort+Tamil+Nadu", visible: true, sortOrder: 4 },
    { id: "javadu-hills", name: "Javadu Hills", location: "Eastern Ghats, Tamil Nadu", description: "A quiet hill region with forest landscapes, village life and scenic drives.", imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80", mapUrl: "https://www.google.com/maps/search/?api=1&query=Javadu+Hills+Tamil+Nadu", visible: true, sortOrder: 5 }
  ]
};
function getConfig(row, key) {
  return row?.published?.[key] || row?.draft?.[key] || defaultConfig[key];
}
router.get("/", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    res.set("Cache-Control", "no-store");
    res.json({ ...getConfig(row, "nearbyPlaces"), places: (getConfig(row, "nearbyPlaces").places || []).filter(place => place.visible).sort((a, b) => a.sortOrder - b.sortOrder) });
  } catch (error) { next(error); }
});
router.use(authenticateToken, requireAdmin);
router.get("/admin", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    res.json({ draft: getConfig(row, "nearbyPlaces"), published: row?.published?.nearbyPlaces || null, publishedAt: row?.publishedAt || null });
  } catch (error) { next(error); }
});
router.put("/admin", async (req, res, next) => {
  try {
    const parsed = placesSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please check the nearby place fields.", errors: parsed.error.flatten() });
    const config = { ...parsed.data, places: parsed.data.places.map((place, index) => ({ ...place, sortOrder: Number.isFinite(place.sortOrder) ? place.sortOrder : index + 1 })) };
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const draft = { ...(row?.draft || defaults), nearbyPlaces: config };
    const published = { ...(row?.published || row?.draft || defaults), nearbyPlaces: config };
    const updated = await prisma.homepageConfig.upsert({
      where: { id: 1 },
      create: { id: 1, draft, published, publishedAt: new Date() },
      update: { draft, published, publishedAt: new Date() }
    });
    res.json({ message: "Nearby places saved and published to the homepage.", draft: updated.draft.nearbyPlaces, publishedAt: updated.publishedAt });
  } catch (error) { next(error); }
});
module.exports = router;
