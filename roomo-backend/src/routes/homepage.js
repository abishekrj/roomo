const express = require("express");
const prisma = require("../lib/prisma");
const defaults = require("../lib/homepageDefaults");
const router = express.Router();

const defaultPlaces = [
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
router.get("/destinations", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const places = row?.published?.destinationPlaces || row?.draft?.destinationPlaces || defaultPlaces;
    res.set("Cache-Control", "no-store");
    res.json({ places });
  } catch (error) { next(error); }
});


function normalizeDestinationName(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function destinationDistance(a, b) {
  const left = normalizeDestinationName(a), right = normalizeDestinationName(b);
  if (!left || !right) return Math.max(left.length, right.length);
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
function similarDestinations(name, places) {
  const normalized = normalizeDestinationName(name);
  return places.map(place => {
    const candidate = normalizeDestinationName(place.name);
    const distance = destinationDistance(normalized, candidate);
    const similarity = 1 - distance / Math.max(normalized.length, candidate.length, 1);
    const sameWords = normalized.split(" ").sort().join(" ") === candidate.split(" ").sort().join(" ");
    return { place, similarity, distance, sameWords };
  }).filter(item => normalizeDestinationName(item.place.name) !== normalized && (item.sameWords || (Math.max(normalized.length, normalizeDestinationName(item.place.name).length) >= 5 && (item.distance <= 2 || item.similarity >= 0.78))))
    .sort((a, b) => b.similarity - a.similarity).slice(0, 5).map(item => item.place);
}
router.post("/destination-suggestions", async (req, res, next) => {
  try {
    const parsed = require("zod").z.object({ name: require("zod").z.string().trim().min(2).max(100) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a destination name between 2 and 100 characters." });
    const name = parsed.data.name.replace(/\s+/g, " ");
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const places = row?.published?.destinationPlaces || row?.draft?.destinationPlaces || defaultPlaces;
    const normalized = normalizeDestinationName(name);
    const exact = places.find(place => normalizeDestinationName(place.name) === normalized);
    if (exact) return res.status(409).json({ message: "This destination already exists. Please select the existing place.", matches: [exact] });
    const matches = similarDestinations(name, places);
    if (matches.length) return res.status(409).json({ message: "We found a similar destination. Please check it before submitting a new suggestion.", matches });
    const draft = { ...(row?.draft || defaults) };
    const published = { ...(row?.published || defaults) };
    const pending = Array.isArray(draft.pendingDestinationSuggestions) ? [...draft.pendingDestinationSuggestions] :
      (Array.isArray(published.pendingDestinationSuggestions) ? [...published.pendingDestinationSuggestions] : []);
    const pendingExact = pending.find(item => normalizeDestinationName(item.name) === normalized);
    if (pendingExact) return res.status(409).json({ message: "This destination is already awaiting admin review.", pending: true });
    const pendingSimilar = similarDestinations(name, pending.map(item => ({ id: item.id, name: item.name })));
    if (pendingSimilar.length) return res.status(409).json({ message: "A similar destination suggestion is already awaiting review.", matches: pendingSimilar, pending: true });
    if (pending.length >= 200) return res.status(429).json({ message: "Destination suggestions are temporarily full. Please try again later." });
    const suggestion = { id: require("crypto").randomUUID(), name, status: "PENDING", createdAt: new Date().toISOString() };
    pending.push(suggestion);
    draft.pendingDestinationSuggestions = pending;
    published.pendingDestinationSuggestions = pending;
    await prisma.homepageConfig.upsert({
      where: { id: 1 },
      create: { id: 1, draft, published, publishedAt: new Date() },
      update: { draft, published, publishedAt: row?.publishedAt || new Date() }
    });
    res.status(201).json({ message: "Thanks! Your destination has been sent to ROOMO for admin review. It will appear in search after approval." });
  } catch (error) { next(error); }
});

router.get("/", async (req, res, next) => {
  try {
    const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
    const content = row?.published || defaults;
    const featuredProperties = await prisma.property.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" } }, reviews: { where: { status: "APPROVED" }, select: { rating: true } } },
      orderBy: [{ featuredSortOrder: "asc" }, { createdAt: "desc" }]
    });
    const featuredPropertiesWithRatings = featuredProperties.map(property => {
      const reviews = property.reviews || [];
      const rating = reviews.length ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10 : null;
      return { ...property, rating, reviewCount: reviews.length };
    });
    res.set("Cache-Control", "no-store");
    res.json({ content: { ...content, featuredProperties: featuredPropertiesWithRatings }, publishedAt: row?.publishedAt || null });
  } catch (error) { next(error); }
});
module.exports = router;
