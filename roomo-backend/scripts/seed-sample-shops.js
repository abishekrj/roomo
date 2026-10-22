/**
 * Adds clearly labelled, UNPUBLISHED demo shop records to the shopping directory
 * in homepage_config. Existing draft/published settings and all other homepage
 * configuration are preserved. Run from roomo-backend with DATABASE_URL configured.
 */
const prisma = require("../src/lib/prisma");
const homepageDefaults = require("../src/lib/homepageDefaults");

const sampleShops = [
  { id: "sample-pooja-store", name: "SAMPLE — Pooja & Spiritual Store", category: "Pooja & Spiritual Items", location: "Demo location — replace with verified address", address: "", openingHours: "Demo hours — verify before publishing", contactNumber: "", imageUrl: "", directionsUrl: "", description: "DEMO RECORD ONLY. Replace this sample with a real, verified shop and accurate contact details before publishing.", visible: false, sortOrder: 1 },
  { id: "sample-traditional-clothing", name: "SAMPLE — Traditional Clothing Shop", category: "Traditional Clothing", location: "Demo location — replace with verified address", address: "", openingHours: "Demo hours — verify before publishing", contactNumber: "", imageUrl: "", directionsUrl: "", description: "DEMO RECORD ONLY. Replace this sample with a real, verified shop and accurate contact details before publishing.", visible: false, sortOrder: 2 },
  { id: "sample-spiritual-books", name: "SAMPLE — Spiritual Books & Gifts", category: "Books & Devotional Gifts", location: "Demo location — replace with verified address", address: "", openingHours: "Demo hours — verify before publishing", contactNumber: "", imageUrl: "", directionsUrl: "", description: "DEMO RECORD ONLY. Replace this sample with a real, verified shop and accurate contact details before publishing.", visible: false, sortOrder: 3 },
  { id: "sample-handicrafts", name: "SAMPLE — Handicrafts & Souvenirs", category: "Handicrafts & Souvenirs", location: "Demo location — replace with verified address", address: "", openingHours: "Demo hours — verify before publishing", contactNumber: "", imageUrl: "", directionsUrl: "", description: "DEMO RECORD ONLY. Replace this sample with a real, verified shop and accurate contact details before publishing.", visible: false, sortOrder: 4 },
  { id: "sample-local-provisions", name: "SAMPLE — Local Essentials Shop", category: "Local Essentials", location: "Demo location — replace with verified address", address: "", openingHours: "Demo hours — verify before publishing", contactNumber: "", imageUrl: "", directionsUrl: "", description: "DEMO RECORD ONLY. Replace this sample with a real, verified shop and accurate contact details before publishing.", visible: false, sortOrder: 5 }
];

async function main() {
  const row = await prisma.homepageConfig.findUnique({ where: { id: 1 } });
  const baseDraft = row?.draft || homepageDefaults;
  const existingDirectory = baseDraft.shoppingDirectory || {
    title: "Best Shops for Shopping",
    description: "Discover verified local shops in Tiruvannamalai.",
    enabled: true,
    shops: []
  };
  const existingShops = Array.isArray(existingDirectory.shops) ? existingDirectory.shops : [];
  const existingIds = new Set(existingShops.map(shop => shop.id));
  const additions = sampleShops.filter(shop => !existingIds.has(shop.id));
  const directory = { ...existingDirectory, shops: [...existingShops, ...additions] };
  const draft = { ...baseDraft, shoppingDirectory: directory };

  await prisma.homepageConfig.upsert({
    where: { id: 1 },
    create: { id: 1, draft, published: row?.published ?? undefined, publishedAt: row?.publishedAt ?? undefined },
    update: { draft }
  });

  console.log(`Shopping directory demo seed complete. Added ${additions.length} unpublished sample shop(s); existing entries and published homepage configuration were preserved.`);
}

main()
  .catch(error => { console.error("Could not seed sample shops:", error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
