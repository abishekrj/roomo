const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const defaults = require("../lib/homepageDefaults");
const router = express.Router();
const heroUploadDir = path.join(__dirname, "../../uploads/hero");
fs.mkdirSync(heroUploadDir, { recursive: true });
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const heroStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, heroUploadDir),
  filename: (req, file, cb) => {
    const extension = ({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif" })[file.mimetype];
    cb(null, Date.now() + "-" + crypto.randomBytes(8).toString("hex") + extension);
  }
});
const heroUpload = multer({
  storage: heroStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.has(file.mimetype)) return cb(new Error("Upload a JPG, PNG, WebP, or AVIF image."));
    cb(null, true);
  }
});
router.use(authenticateToken, requireAdmin);

const featuredRoomSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(160),
  type: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(250),
  rating: z.coerce.number().min(0).max(5).default(0),
  reviews: z.coerce.number().int().min(0).max(10000000).default(0),
  price: z.coerce.number().min(0).max(10000000),
  img: z.string().trim().url().max(2000),
  desc: z.string().trim().min(1).max(2000),
  featured: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0)
});
const featuredSectionSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(1000),
  rooms: z.array(featuredRoomSchema).max(30)
}).superRefine((data, ctx) => {
  const ids = data.rooms.map(room => room.id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rooms"], message: "Each room must have a unique ID." });
});

const homepageSchema = z.object({
  searchSuggestionLimit: z.coerce.number().int().min(1).max(10).default(5),
  transportPromo: z.object({
    enabled: z.boolean().default(true),
    eyebrow: z.string().trim().max(120).default("ROOMO Travel"),
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().min(5).max(1000),
    buttonLabel: z.string().trim().min(2).max(80),
    helperText: z.string().trim().max(200).default(""),
    imageLabel: z.string().trim().max(100).default("")
  }).optional(),
  siteTitle: z.string().trim().min(5).max(160),
  heroBadge: z.string().trim().min(1).max(160),
  heroTitleLine: z.string().trim().min(1).max(120),
  heroTitleAccent: z.string().trim().min(1).max(120),
  heroDescription: z.string().trim().min(10).max(1000),
  heroImageUrl: z.string().trim().url().max(2000).refine(value => value.startsWith("https://") || value.startsWith("http://localhost:5001/uploads/"), "Use HTTPS for image URLs except local ROOMO uploads.").optional(),
  heroSecondBadge: z.string().trim().min(1).max(160).optional(),
  heroSecondTitleLine: z.string().trim().min(1).max(120).optional(),
  heroSecondTitleAccent: z.string().trim().min(1).max(120).optional(),
  heroSecondDescription: z.string().trim().min(10).max(1000).optional(),
  heroSecondImageUrl: z.string().trim().url().max(2000).refine(value => value.startsWith("https://") || value.startsWith("http://localhost:5001/uploads/"), "Use HTTPS for image URLs except local ROOMO uploads.").optional(),
  pournamiItems: z.array(z.object({ eyebrow: z.string().trim().min(1).max(50), title: z.string().trim().min(1).max(70), description: z.string().trim().min(1).max(110) })).length(5).default([{"eyebrow":"FULL MOON GIRIVALAM","title":"Walk Around Arunachala","description":"A sacred 14-km hill circuit."},{"eyebrow":"ANNAMALAIYAR TEMPLE","title":"Plan Your Darshan","description":"Visit the grand Arunachaleswarar Temple."},{"eyebrow":"SRI RAMANASRAMAM","title":"Find Quietude","description":"Pause in the ashram’s serene setting."},{"eyebrow":"ARUNACHALA HILL","title":"Sacred Hill Views","description":"Take in the presence of holy Arunachala."},{"eyebrow":"KARTHIGAI DEEPAM","title":"Plan Your Festival Stay","description":"Reserve early for the Deepam season."}]),
  festivalTitle: z.string().trim().min(1).max(160),
  festivalDescription: z.string().trim().min(10).max(1000),
  festivalDate: z.string().trim().min(10).max(50),
  footerDescription: z.string().trim().min(10).max(500),
  contactPhone: z.string().trim().min(5).max(40),
  whatsappNumber: z.string().trim().regex(/^\d{8,15}$/),
  seoDescription: z.string().trim().min(10).max(300),

  testimonials: z.object({ eyebrow: z.string().trim().min(1).max(100), title: z.string().trim().min(1).max(160), description: z.string().trim().min(1).max(500), ratingSummary: z.string().trim().min(1).max(100), items: z.array(z.object({ id: z.string().trim().min(1).max(80), quote: z.string().trim().min(1).max(2000), name: z.string().trim().min(1).max(120), location: z.string().trim().max(120), rating: z.number().int().min(1).max(5), hidden: z.boolean() })).max(50) }).optional(),
  footerLinks: z.object({
    social: z.array(z.object({ label: z.string().trim().min(1).max(80), url: z.string().trim().min(1).max(500), icon: z.string().trim().min(1).max(80) })).max(12),
    sanctuaries: z.array(z.object({ label: z.string().trim().min(1).max(100), url: z.string().trim().min(1).max(500) })).max(20),
    pilgrimCare: z.array(z.object({ label: z.string().trim().min(1).max(100), url: z.string().trim().min(1).max(500) })).max(20),
    legal: z.array(z.object({ label: z.string().trim().min(1).max(100), url: z.string().trim().min(1).max(500) })).max(20)
  })
});

const defaultDestinationPlaces = [
  {
    "id": "annamalaiyar-temple",
    "name": "Annamalaiyar Temple"
  },
  {
    "id": "sri-ramanasramam",
    "name": "Sri Ramanasramam"
  },
  {
    "id": "girivalam-path",
    "name": "Girivalam Path"
  },
  {
    "id": "arunachala-hill",
    "name": "Arunachala Hill"
  },
  {
    "id": "skandashramam",
    "name": "Skandashramam"
  },
  {
    "id": "virupaksha-cave",
    "name": "Virupaksha Cave"
  },
  {
    "id": "seshadri-swamigal-ashram",
    "name": "Seshadri Swamigal Ashram"
  },
  {
    "id": "yogi-ramsuratkumar-ashram",
    "name": "Yogi Ramsuratkumar Ashram"
  },
  {
    "id": "adi-annamalai-temple",
    "name": "Adi Annamalai Temple"
  },
  {
    "id": "central-bus-stand",
    "name": "Tiruvannamalai Central Bus Stand"
  },
  {
    "id": "railway-station",
    "name": "Tiruvannamalai Railway Station"
  }
];
const destinationSchema = z.object({
  name: z.string().trim().min(2).max(100)
});
function destinationSlug(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "destination";
}
async function saveDestinationPlaces(places) {
  const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
  const draft = { ...(row?.draft || defaults), destinationPlaces: places };
  const published = { ...(row?.published || defaults), destinationPlaces: places };
  return prisma.homepageConfig.upsert({
    where: { id: 1 },
    create: { id: 1, draft, published, publishedAt: new Date() },
    update: { draft, published, publishedAt: row?.publishedAt || new Date() }
  });
}
router.get("/destinations", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    res.json({ places: row?.draft?.destinationPlaces || row?.published?.destinationPlaces || defaultDestinationPlaces });
  } catch (error) { next(error); }
});
router.post("/destinations", async (req, res, next) => {
  try {
    const parsed = destinationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a destination name between 2 and 100 characters." });
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const places = [...(row?.draft?.destinationPlaces || row?.published?.destinationPlaces || defaultDestinationPlaces)];
    const normalizedName = normalizeDestinationName(parsed.data.name);
    const exactMatch = places.find(place => normalizeDestinationName(place.name) === normalizedName);
    if (exactMatch) return res.status(409).json({ message: "That destination already exists.", matches: [exactMatch] });
    const similarMatch = findSimilarDestination(parsed.data.name, places);
    if (similarMatch) return res.status(409).json({ message: 'This may be a spelling duplicate of "' + similarMatch.name + '". Use the existing destination or correct the spelling.', matches: [similarMatch] });
    const base = destinationSlug(parsed.data.name);
    let id = base, suffix = 2;
    while (places.some(place => place.id === id)) id = base + "-" + suffix++;
    places.push({ id, name: parsed.data.name });
    await saveDestinationPlaces(places);
    res.status(201).json({ message: "Destination added and made available on the homepage.", places });
  } catch (error) { next(error); }
});
router.put("/destinations/:id", async (req, res, next) => {
  try {
    const parsed = destinationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a destination name between 2 and 100 characters." });
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const places = [...(row?.draft?.destinationPlaces || row?.published?.destinationPlaces || defaultDestinationPlaces)];
    const index = places.findIndex(place => place.id === req.params.id);
    if (index < 0) return res.status(404).json({ message: "Destination not found. Reload the list and try again." });
    const otherPlaces = places.filter((place, i) => i !== index);
    const normalizedName = normalizeDestinationName(parsed.data.name);
    const exactMatch = otherPlaces.find(place => normalizeDestinationName(place.name) === normalizedName);
    if (exactMatch) return res.status(409).json({ message: "That destination already exists.", matches: [exactMatch] });
    const similarMatch = findSimilarDestination(parsed.data.name, otherPlaces);
    if (similarMatch) return res.status(409).json({ message: 'This may be a spelling duplicate of "' + similarMatch.name + '". Use the existing destination or correct the spelling.', matches: [similarMatch] });
    places[index] = { ...places[index], name: parsed.data.name };
    await saveDestinationPlaces(places);
    res.json({ message: "Destination updated on the homepage.", places });
  } catch (error) { next(error); }
});
router.delete("/destinations/:id", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const places = [...(row?.draft?.destinationPlaces || row?.published?.destinationPlaces || defaultDestinationPlaces)];
    const nextPlaces = places.filter(place => place.id !== req.params.id);
    if (nextPlaces.length === places.length) return res.status(404).json({ message: "Destination not found. Reload the list and try again." });
    await saveDestinationPlaces(nextPlaces);
    res.json({ message: "Destination deleted from the homepage dropdown.", places: nextPlaces });
  } catch (error) { next(error); }
});


function normalizeDestinationName(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function destinationDistance(a, b) {
  const left = normalizeDestinationName(a), right = normalizeDestinationName(b);
  const row = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i++) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = old;
    }
  }
  return row[right.length];
}
function findSimilarDestination(name, places) {
  const normalized = normalizeDestinationName(name);
  return places.map(place => {
    const candidate = normalizeDestinationName(place.name);
    const distance = destinationDistance(normalized, candidate);
    const similarity = 1 - distance / Math.max(normalized.length, candidate.length, 1);
    const sameWords = normalized.split(" ").sort().join(" ") === candidate.split(" ").sort().join(" ");
    return { place, distance, similarity, sameWords };
  }).find(item => item.sameWords || (Math.max(normalized.length, normalizeDestinationName(item.place.name).length) >= 5 && (item.distance <= 2 || item.similarity >= 0.78)))?.place || null;
}
async function readDestinationConfig() {
  const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
  const draft = { ...(row?.draft || defaults) };
  const published = { ...(row?.published || defaults) };
  const places = draft.destinationPlaces || published.destinationPlaces || defaultDestinationPlaces;
  const pending = draft.pendingDestinationSuggestions || published.pendingDestinationSuggestions || [];
  return { row, draft, published, places, pending };
}
async function saveDestinationSuggestions(config, pending, places = config.places) {
  config.draft.destinationPlaces = places;
  config.published.destinationPlaces = places;
  config.draft.pendingDestinationSuggestions = pending;
  config.published.pendingDestinationSuggestions = pending;
  return prisma.homepageConfig.upsert({
    where: { id: 1 },
    create: { id: 1, draft: config.draft, published: config.published, publishedAt: new Date() },
    update: { draft: config.draft, published: config.published, publishedAt: config.row?.publishedAt || new Date() }
  });
}
router.get("/destination-suggestions", async (req, res, next) => {
  try {
    const config = await readDestinationConfig();
    res.json({ suggestions: config.pending.filter(item => item.status === "PENDING") });
  } catch (error) { next(error); }
});
router.put("/destination-suggestions/:id", async (req, res, next) => {
  try {
    const parsed = z.object({
      action: z.enum(["approve", "reject"]),
      name: z.string().trim().min(2).max(100).optional()
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Choose approve or reject and check the destination name." });
    const config = await readDestinationConfig();
    const index = config.pending.findIndex(item => item.id === req.params.id && item.status === "PENDING");
    if (index < 0) return res.status(404).json({ message: "Pending suggestion not found. Refresh the page." });
    const suggestion = config.pending[index];
    if (parsed.data.action === "reject") {
      config.pending[index] = { ...suggestion, status: "REJECTED", reviewedAt: new Date().toISOString() };
      await saveDestinationSuggestions(config, config.pending);
      return res.json({ message: "Destination suggestion rejected.", suggestions: config.pending.filter(item => item.status === "PENDING"), places: config.places });
    }
    const name = (parsed.data.name || suggestion.name).replace(/\s+/g, " ");
    const normalized = normalizeDestinationName(name);
    const exact = config.places.find(place => normalizeDestinationName(place.name) === normalized);
    if (exact) return res.status(409).json({ message: 'A destination named "' + exact.name + '" already exists. Edit the suggested name or reject it.', matches: [exact] });
    const similar = findSimilarDestination(name, config.places);
    if (similar) return res.status(409).json({ message: 'This looks similar to "' + similar.name + '". Edit the name to the canonical spelling or reject the suggestion.', matches: [similar] });
    const base = destinationSlug(name);
    let id = base, suffix = 2;
    while (config.places.some(place => place.id === id)) id = base + "-" + suffix++;
    config.places.push({ id, name });
    config.pending[index] = { ...suggestion, name, status: "APPROVED", reviewedAt: new Date().toISOString(), destinationId: id };
    await saveDestinationSuggestions(config, config.pending, config.places);
    res.json({ message: "Destination approved and added to the homepage dropdown.", suggestions: config.pending.filter(item => item.status === "PENDING"), places: config.places });
  } catch (error) { next(error); }
});

router.post("/hero-image/second", heroUpload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose an image to upload." });
  const baseUrl = req.protocol + "://" + req.get("host");
  res.status(201).json({ heroSecondImageUrl: baseUrl + "/uploads/hero/" + req.file.filename });
});

router.post("/hero-image", heroUpload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose an image to upload." });
  const baseUrl = req.protocol + "://" + req.get("host");
  res.status(201).json({
    message: "Hero image uploaded. Save Draft and publish to make it live.",
    heroImageUrl: baseUrl + "/uploads/hero/" + req.file.filename
  });
});

router.get("/featured-rooms", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const properties = await prisma.property.findMany({
      where: { isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ featuredSortOrder: "asc" }, { createdAt: "desc" }]
    });
    const source = row?.draft || row?.published || defaults;
    res.json({
      title: source.featuredSectionTitle || defaults.featuredSectionTitle,
      description: source.featuredSectionDescription || defaults.featuredSectionDescription,
      properties
    });
  } catch (error) { next(error); }
});
router.put("/featured-rooms", async (req, res, next) => {
  try {
    const parsed = z.object({
      title: z.string().trim().min(1).max(160),
      description: z.string().trim().min(1).max(1000),
      propertyIds: z.array(z.string().uuid()).max(100).optional()
    }).superRefine((data, ctx) => {
      if (data.propertyIds && new Set(data.propertyIds).size !== data.propertyIds.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["propertyIds"], message: "Duplicate featured property IDs are not allowed." });
      }
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please check the section title and description." });
    if (parsed.data.propertyIds) {
      const selected = await prisma.property.findMany({
        where: { id: { in: parsed.data.propertyIds }, isFeatured: true },
        select: { id: true }
      });
      if (selected.length !== parsed.data.propertyIds.length) {
        return res.status(400).json({ message: "The featured list changed. Reload Featured Rooms and try again." });
      }
      await prisma.$transaction(parsed.data.propertyIds.map((id, index) =>
        prisma.property.update({ where: { id }, data: { featuredSortOrder: index + 1 } })
      ));
    }
    const existing = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const section = { featuredSectionTitle: parsed.data.title, featuredSectionDescription: parsed.data.description };
    const draft = { ...(existing?.draft || defaults), ...section };
    const published = { ...(existing?.published || defaults), ...section };
    await prisma.homepageConfig.upsert({
      where: { id: 1 },
      create: { id: 1, draft, published, publishedAt: new Date() },
      update: { draft, published, publishedAt: new Date() }
    });
    const properties = await prisma.property.findMany({
      where: { isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ featuredSortOrder: "asc" }, { createdAt: "desc" }]
    });
    res.json({ message: "Featured section content saved and published. Room selection is managed in Rooms Listings.", ...parsed.data, properties });
  } catch (error) { next(error); }
});

const pilgrimGuideSchema = z.object({
  enabled: z.boolean(),
  eyebrow: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(1000),
  cards: z.array(z.object({
    label: z.string().trim().min(1).max(100),
    icon: z.string().trim().min(1).max(80).regex(/^bi-[a-z0-9-]+$/),
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(1200),
    badge: z.string().trim().min(1).max(160),
    badgeIcon: z.string().trim().min(1).max(80).regex(/^bi-[a-z0-9-]+$/)
  })).length(3)
});
router.get("/pilgrim-guide", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    res.set("Cache-Control", "no-store");
    res.json({ draft: row?.draft?.pilgrimGuide || defaults.pilgrimGuide, published: row?.published?.pilgrimGuide || defaults.pilgrimGuide, hasPublished: Boolean(row?.published) });
  } catch (error) { next(error); }
});
router.put("/pilgrim-guide", async (req, res, next) => {
  try {
    const parsed = pilgrimGuideSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please check the Pilgrim Guide fields.", errors: parsed.error.flatten() });
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const draft = { ...(row?.draft || defaults), pilgrimGuide: parsed.data };
    const updated = await prisma.homepageConfig.upsert({
      where: { id: 1 },
      create: { id: 1, draft },
      update: { draft }
    });
    res.json({ message: "Pilgrim Guide draft saved. Publish Homepage to make the changes visible to visitors.", draft: updated.draft.pilgrimGuide });
  } catch (error) { next(error); }
});

router.get("/", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    res.json({ draft: row?.draft || defaults, published: row?.published || null, publishedAt: row?.publishedAt || null, hasPublished: Boolean(row?.published) });
  } catch (error) { next(error); }
});
router.put("/", async (req, res, next) => {
  try {
    const parsed = homepageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please check the homepage fields.", errors: parsed.error.flatten() });
    const existing = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const mergedDraft = { ...(existing?.draft || defaults), ...parsed.data, testimonials: parsed.data.testimonials || existing?.draft?.testimonials || defaults.testimonials };
    const row = await prisma.homepageConfig.upsert({
      where: { id: 1 }, create: { id: 1, draft: mergedDraft }, update: { draft: mergedDraft }
    });
    res.json({ message: "Draft saved. The public homepage has not changed yet.", draft: row.draft });
  } catch (error) { next(error); }
});
router.post("/publish", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const parsed = homepageSchema.safeParse({ ...(row?.draft || defaults), testimonials: row?.draft?.testimonials || defaults.testimonials });
    if (!parsed.success) return res.status(400).json({ message: "The saved draft is invalid. Save it again before publishing." });
    const featured = {
      featuredSectionTitle: row?.draft?.featuredSectionTitle || row?.published?.featuredSectionTitle || defaults.featuredSectionTitle,
      featuredSectionDescription: row?.draft?.featuredSectionDescription || row?.published?.featuredSectionDescription || defaults.featuredSectionDescription,
      featuredRooms: row?.draft?.featuredRooms || row?.published?.featuredRooms || defaults.featuredRooms
    };
    const destinationPlaces = row?.draft?.destinationPlaces || row?.published?.destinationPlaces || defaultDestinationPlaces;
    const visitorStats = row?.draft?.visitorStats || row?.published?.visitorStats || { count: 0, visible: true };
    const pilgrimGuide = row?.draft?.pilgrimGuide || row?.published?.pilgrimGuide || defaults.pilgrimGuide;
    const publishedContent = { ...parsed.data, ...featured, destinationPlaces, visitorStats, pilgrimGuide };
    const updated = await prisma.homepageConfig.upsert({
      where: { id: 1 },
      create: { id: 1, draft: { ...parsed.data, ...featured }, published: publishedContent, publishedAt: new Date() },
      update: { published: publishedContent, publishedAt: new Date() }
    });
    res.json({ message: "Homepage published successfully.", publishedAt: updated.publishedAt });
  } catch (error) { next(error); }
});
module.exports = router;
