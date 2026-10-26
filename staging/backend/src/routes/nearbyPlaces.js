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
 enabled:true, eyebrow:"Travel beyond Tiruvannamalai", title:"Famous Places Nearby",
 description:"Planning your journey to Tiruvannamalai? Explore popular cities and towns we connect with. Choose your destination to start a ROOMO outstation ride request.",
 places:[
 {id:"chennai",name:"Chennai",category:"Major city",location:"Tamil Nadu",distance:"Approx. 190 km",travelTime:"Allow around 4–5 hours by road",openingHours:"Travel times vary with traffic and pickup point",description:"Plan an outstation journey between Chennai and Tiruvannamalai for pilgrimage stays, family visits or a return trip.",imageUrl:"https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1000&q=80",mapUrl:"https://www.google.com/maps/dir/?api=1&origin=Chennai&destination=Tiruvannamalai",visible:true,sortOrder:1},
 {id:"bangalore",name:"Bangalore",category:"Major city",location:"Karnataka",distance:"Approx. 200 km",travelTime:"Allow around 4–5 hours by road",openingHours:"Travel times vary with traffic and pickup point",description:"Request a ride from Bengaluru to Tiruvannamalai, or plan your return journey after your sacred visit.",imageUrl:"https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1000&q=80",mapUrl:"https://www.google.com/maps/dir/?api=1&origin=Bengaluru&destination=Tiruvannamalai",visible:true,sortOrder:2},
 {id:"vellore",name:"Vellore",category:"Nearby city",location:"Tamil Nadu",distance:"Approx. 85 km",travelTime:"Allow around 1.5–2.5 hours by road",openingHours:"Travel times vary with traffic and pickup point",description:"Arrange an outstation car between Vellore and Tiruvannamalai for a convenient onward or return trip.",imageUrl:"https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1000&q=80",mapUrl:"https://www.google.com/maps/dir/?api=1&origin=Vellore&destination=Tiruvannamalai",visible:true,sortOrder:3},
 {id:"madurai",name:"Madurai",category:"Major city",location:"Tamil Nadu",distance:"Approx. 300 km",travelTime:"Allow around 5–7 hours by road",openingHours:"Travel times vary with traffic and pickup point",description:"Plan a longer intercity journey from Madurai to Tiruvannamalai, with your pickup and travel date specified in the ride request.",imageUrl:"https://images.unsplash.com/photo-1600100397608-f0107c7a9b7c?auto=format&fit=crop&w=1000&q=80",mapUrl:"https://www.google.com/maps/dir/?api=1&origin=Madurai&destination=Tiruvannamalai",visible:true,sortOrder:4},
 {id:"coimbatore",name:"Coimbatore",category:"Major city",location:"Tamil Nadu",distance:"Approx. 330 km",travelTime:"Allow around 6–8 hours by road",openingHours:"Travel times vary with traffic and pickup point",description:"Connect Coimbatore with Tiruvannamalai for pilgrimage travel, group visits and planned return journeys.",imageUrl:"https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1000&q=80",mapUrl:"https://www.google.com/maps/dir/?api=1&origin=Coimbatore&destination=Tiruvannamalai",visible:true,sortOrder:5},
 {id:"pondicherry",name:"Pondicherry",category:"Coastal city",location:"Puducherry",distance:"Approx. 110 km",travelTime:"Allow around 2–3 hours by road",openingHours:"Travel times vary with traffic and pickup point",description:"Plan a comfortable outstation trip between Puducherry and Tiruvannamalai for a day visit or pilgrimage stay.",imageUrl:"https://images.unsplash.com/photo-1582972236019-ea4af5ffe587?auto=format&fit=crop&w=1000&q=80",mapUrl:"https://www.google.com/maps/dir/?api=1&origin=Puducherry&destination=Tiruvannamalai",visible:true,sortOrder:6},
 {id:"villupuram",name:"Villupuram",category:"Nearby town",location:"Tamil Nadu",distance:"Approx. 65 km",travelTime:"Allow around 1–1.5 hours by road",openingHours:"Travel times vary with traffic and pickup point",description:"Arrange a short intercity ride between Villupuram and Tiruvannamalai with pickup and destination details included in your request.",imageUrl:"https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1000&q=80",mapUrl:"https://www.google.com/maps/dir/?api=1&origin=Villupuram&destination=Tiruvannamalai",visible:true,sortOrder:7}
 ]
};
function getConfig(row, key) {
  const fallback = key === "nearbyPlaces" ? defaultConfig : defaults[key];
  const saved = row?.published?.[key] || row?.draft?.[key];
  const legacyIds = new Set(["sathanur-dam", "yelagiri-hills", "parvathamalai", "gingee-fort", "javadu-hills", "annamalaiyar-temple", "sri-ramanasramam", "girivalam-path", "virupaksha-cave", "skandashramam"]);
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
