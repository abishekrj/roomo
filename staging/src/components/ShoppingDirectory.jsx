import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:5001/api/homepage/shops";
const DEFAULT_TITLE = "Best Shops for Shopping";
const DEFAULT_DESCRIPTION = "Discover verified local shops in Tiruvannamalai.";

const shopPhotos = [
  { terms: /pooja|spiritual|temple|flower|incense|puja|religious/i, url: "https://images.unsplash.com/photo-1606293926075-69a00db143d5?auto=format&fit=crop&w=1400&q=85" },
  { terms: /silk|saree|textile|cloth|dress|fashion|garment|boutique/i, url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=85" },
  { terms: /sweet|snack|food|bakery|restaurant|grocery|provision|fruit|spice/i, url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&q=85" },
  { terms: /handicraft|craft|souvenir|wood|brass|pottery|handloom|artisan/i, url: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1400&q=85" },
  { terms: /jewel|gold|silver|ornament/i, url: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=85" },
  { terms: /book|stationery|print|gift/i, url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1400&q=85" },
  { terms: /ayur|herbal|organic|wellness|health/i, url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1400&q=85" }
];
const fallbackPhotos = [
  "https://images.unsplash.com/photo-1606293926075-69a00db143d5?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1400&q=85"
];

function shopName(shop) {
  return String(shop?.name || "").replace(/^SAMPLE\s*[—–-]\s*/i, "").trim();
}
function shopImage(shop) {
  if (shop.imageUrl) return shop.imageUrl;
  const description = [shop.name, shop.category, shop.specialties, shop.description].filter(Boolean).join(" ");
  const match = shopPhotos.find(item => item.terms.test(description));
  const index = Array.from(String(shop.id || shop.name || "shop")).reduce((sum, char) => sum + char.charCodeAt(0), 0) % fallbackPhotos.length;
  return match?.url || fallbackPhotos[index];
}
function directionsUrl(shop) {
  return shop.directionsUrl || "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent([shopName(shop), shop.address || shop.location, "Tiruvannamalai"].filter(Boolean).join(", "));
}
function offerLabel(value) {
  const label = String(value || "").trim();
  return /^\d+(?:\.\d+)?\s*%\s*(?:OFF)?$/i.test(label) && !/\bOFF\b/i.test(label) ? label + " OFF" : label;
}

function ShopCard({ shop }) {
  const [imageFailed, setImageFailed] = useState(false);
  const name = shopName(shop) || "Local shop";
  const imageUrl = shopImage(shop);
  return (
    <article className="roomo-shop-card">
      <a className="roomo-shop-card-main" href={"/frontend/shop-details.html?id=" + encodeURIComponent(shop.id || "")}>
        <div className="roomo-shop-card-image">
          {!imageFailed ? (
            <img src={imageUrl} alt={name} loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
          ) : (
            <div className="roomo-shop-image-placeholder" aria-label="Shop image unavailable"><span aria-hidden="true">⌂</span></div>
          )}
          {shop.offerTag && <span className="roomo-shop-offer"><span aria-hidden="true">♢</span> {offerLabel(shop.offerTag)}</span>}
        </div>
        <div className="roomo-shop-card-copy">
          {shop.category && <span className="roomo-shop-category">{shop.category}</span>}
          <h3>{name}</h3>
          {shop.location && <p><span aria-hidden="true">⌖</span>{shop.location}</p>}
          {shop.openingHours && <p><span aria-hidden="true">◷</span>{shop.openingHours}</p>}
        </div>
      </a>
      <a className="roomo-shop-directions" href={directionsUrl(shop)} target="_blank" rel="noopener noreferrer">
        <span aria-hidden="true">↗</span> Directions
      </a>
    </article>
  );
}

export default function ShoppingDirectory() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(API_URL, { cache: "no-store", signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("Shopping API returned HTTP " + response.status);
        return response.json();
      })
      .then(data => setConfig(data || {}))
      .catch(error => {
        if (error.name !== "AbortError") {
          console.warn("ROOMO shopping directory could not load.", error);
          setFailed(true);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const shops = (Array.isArray(config?.shops) ? config.shops : [])
    .filter(shop => shop && shop.visible !== false)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  const scroll = direction => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(".roomo-shop-card");
    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const distance = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.85;
    track.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  if (!loading && config?.enabled === false) return null;
  if (!loading && !failed && shops.length === 0 && config?.enabled !== true) return null;

  return (
    <section aria-labelledby="roomo-shopping-title" className="roomo-shopping-section">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="roomo-shopping-heading">
          <div className="max-w-3xl">
            <span className="roomo-shopping-eyebrow">LOCAL SHOPPING GUIDE</span>
            <h2 id="roomo-shopping-title">{config?.title || DEFAULT_TITLE}</h2>
            <p>{config?.description || DEFAULT_DESCRIPTION}</p>
          </div>
          <div className="roomo-shopping-controls">
            <a className="roomo-shopping-view-all" href="/frontend/shopping.html">View All Shops <span aria-hidden="true">→</span></a>
            <div className="flex items-center gap-2">
              <button type="button" className="roomo-shopping-arrow" onClick={() => scroll(-1)} aria-label="Previous shops" disabled={loading || shops.length < 2}>‹</button>
              <button type="button" className="roomo-shopping-arrow" onClick={() => scroll(1)} aria-label="Next shops" disabled={loading || shops.length < 2}>›</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading shops">
            {[0, 1, 2, 3].map(item => <div key={item} className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="aspect-[16/10] animate-pulse bg-slate-100" /><div className="space-y-3 p-4"><div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-3 w-full animate-pulse rounded bg-slate-100" /></div></div>)}
          </div>
        ) : failed ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">The local shopping guide is temporarily unavailable. Please try again shortly.</p>
        ) : shops.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">No shops have been published yet. Please check back soon.</p>
        ) : (
          <div ref={trackRef} className="roomo-shopping-track" aria-label="Local shops in Tiruvannamalai">
            {shops.map((shop, index) => <ShopCard key={shop.id || shop.name || index} shop={shop} />)}
          </div>
        )}
      </div>
    </section>
  );
}
