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
  category: z.string().trim().max(80).default("Sacred place"),
  location: z.string().trim().min(2).max(180),
  distance: z.string().trim().max(80).default(""),
  travelTime: z.string().trim().max(80).default(""),
  openingHours: z.string().trim().max(160).default(""),
  description: z.string().trim().max(500).default(""),
  imageUrl: z.string().trim().max(2000).refine(value => !value || /^https?:\/\//i.test(value), "Use a valid image URL.").default(""),
  mapUrl: z.string().trim().max(2000).refine(value => !value || /^https?:\/\//i.test(value), "Use a valid map URL.").default(""),
  visible: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0)
});
const placesSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: z.string().trim().max(120).default("Sacred places, thoughtfully planned"),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(400),
  places: z.array(placeSchema).max(50)
}).superRefine((data, ctx) => {
  const ids = data.places.map(place => place.id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["places"], message: "Each nearby place must have a unique ID." });
});

const defaultConfig = {
  enabled:true, eyebrow:"Sacred places, thoughtfully planned", title:"Famous Places Nearby",
  description:"Discover the temples, ashrams and sacred paths that make Tiruvannamalai special. Choose a place to explore details or plan a ride from your stay.",
  places:[
    {id:"annamalaiyar-temple",name:"Arunachaleswarar Temple",category:"Temple",location:"Temple town, Tiruvannamalai",distance:"Town centre",travelTime:"Allow time for darshan",openingHours:"Check current temple timings before visiting",description:"Visit the renowned Shiva temple at the heart of Tiruvannamalai, closely associated with sacred Arunachala.",imageUrl:"https://images.unsplash.com/photo-1606293926075-69a00db676e3?auto=format&fit=crop&w=1000&q=80",mapUrl:"https://www.google.com/maps/search/?api=1&query=Arunachaleswarar+Temple+Tiruvannamalai",visible:true,sortOrder:1},
    {id:"sri-ramanasramam",name:"Sri Ramanasramam",category:"Ashram",location:"Arunachala foothills",distance:"Near the hill",travelTime:"Short local ride",openingHours:"Check visitor guidance before travelling",description:"Spend a quiet moment at the ashram associated with Sri Ramana Maharshi. Please respect the peaceful atmosphere.",imageUrl:"https://images.unsplash.com/photo-1604608672516-8d0f6c9a2c0b?auto=format&fit=crop&w=1000&q=80",mapUrl:"https://www.google.com/maps/search/?api=1&query=Sri+Ramanasramam+Tiruvannamalai",visible:true,sortOrder:2},
    {id:"girivalam-path",name:"Girivalam Path",category:"Pilgrimage route",location:"Around Arunachala",distance:"Approx. 14 km circuit",travelTime:"Plan breaks along the route",openingHours:"Busy during full-moon periods",description:"Plan the traditional circumambulation around Arunachala. Carry drinking water and allow time for rest stops.",imageUrl:"https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80",mapUrl:"https://www.google.com/maps/search/?api=1&query=Girivalam+Path+Tiruvannamalai",visible:true,sortOrder:3},
    {id:"virupaksha-cave",name:"Virupaksha Cave",category:"Sacred site",location:"Arunachala Hill",distance:"Hill walk",travelTime:"Allow time for the uphill approach",openingHours:"Check local access conditions",description:"A meditation cave on Arunachala associated with Sri Ramana Maharshi. Wear suitable footwear for the hill path.",imageUrl:"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=80",mapUrl:"https://www.google.com/maps/search/?api=1&query=Virupaksha+Cave+Tiruvannamalai",visible:true,sortOrder:4},
    {id:"skandashramam",name:"Skandashramam",category:"Ashram",location:"Arunachala Hill",distance:"Hill walk",travelTime:"Allow time for the uphill approach",openingHours:"Check local access conditions",description:"A serene hill ashram associated with Sri Ramana Maharshi. Plan for a walking approach and check conditions locally.",imageUrl:"https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1000&q=80",mapUrl:"https://www.google.com/maps/search/?api=1&query=Skandashramam+Tiruvannamalai",visible:true,sortOrder:5}
  ]
};
function getConfig(row, key) {
  const fallback = key === "nearbyPlaces" ? defaultConfig : defaults[key];
  const saved = row?.published?.[key] || row?.draft?.[key];
  const legacyIds = new Set(["sathanur-dam", "yelagiri-hills", "parvathamalai", "gingee-fort", "javadu-hills"]);
  if (key === "nearbyPlaces" && Array.isArray(saved?.places) && saved.places.some(place => legacyIds.has(place.id))) return defaultConfig;
  return saved || fallback;
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
