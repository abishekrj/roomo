import { useEffect, useRef, useState } from "react";
import { StarRatingDisplay } from "./StarRating.jsx";

const API_BASE = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";
const API_URL = `${API_BASE}/homepage`;
const API_ORIGIN = new URL(API_URL).origin;
function csrfHeaders() {
  const item = document.cookie.split("; ").find(part => part.startsWith("roomo_csrf="));
  return item ? { "X-CSRF-Token": decodeURIComponent(item.slice("roomo_csrf=".length)) } : {};
}

function resolveImageUrl(value) {
  const raw = typeof value === "string" ? value : (
    value?.imageUrl || value?.imagePath || value?.fileUrl || value?.mediaUrl ||
    value?.thumbnailUrl || value?.url || value?.path || value?.src ||
    value?.filename || value?.fileName || ""
  );
  if (!raw || typeof raw !== "string") return "";
  const path = raw.trim().replace(/\\\\/g, "/");
  if (!path) return "";
  if (/^(data:|blob:)/i.test(path)) return path;
  try {
    const url = new URL(path, API_ORIGIN);
    // Old upload rows can contain a Vite-hosted localhost URL; uploads are
    // actually exposed from the backend's /uploads static directory.
    if (["localhost", "127.0.0.1"].includes(url.hostname) && url.port !== "5001" && url.pathname.startsWith("/uploads/")) {
      url.protocol = "http:";
      url.hostname = "localhost";
      url.port = "5001";
    }
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch { /* Ignore malformed image URLs and render the fallback. */ }
  return "";
}

export default function FeaturedStays() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef(null);
  const [favourites, setFavourites] = useState([]);
  const [favouriteNotice, setFavouriteNotice] = useState("");
  const [guestUser, setGuestUser] = useState(null);
  const [guestReady, setGuestReady] = useState(false);
  const [favouriteBusy, setFavouriteBusy] = useState(false);
  const pendingFavouriteRef = useRef("");
  const pendingFavouriteBusyRef = useRef(false);

  // The HttpOnly cookie is the only authentication source. Never trust a profile
  // or session token read from localStorage/sessionStorage.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/guest-auth/me`, { credentials: "include", cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("No active guest session");
        const data = await response.json();
        if (!data.user) throw new Error("Missing guest profile");
        if (!cancelled) setGuestUser(data.user);
      })
      .catch(() => { if (!cancelled) setGuestUser(null); })
      .finally(() => { if (!cancelled) setGuestReady(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!guestReady || !guestUser) { setFavourites([]); return; }
    let cancelled = false;
    fetch(`${API_BASE}/favorites`, { credentials: "include", cache: "no-store" })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to load your saved stays.");
        const ids = Array.isArray(data.favorites) ? data.favorites.map(item => String(item.propertyId)) : [];
        if (!cancelled) {
          setFavourites(ids);
          const pendingId = new URLSearchParams(window.location.search).get("favorite");
          if (pendingId) pendingFavouriteRef.current = pendingId;
        }
      })
      .catch(() => { if (!cancelled) setFavouriteNotice("Your saved stays could not be loaded. Please refresh and try again."); });
    return () => { cancelled = true; };
  }, [guestReady, guestUser]);

  const propertySnapshot = stay => ({
    id: String(stay.id),
    name: String(stay.name || "ROOMO stay"),
    type: String(stay.type || "Sanctuary stay"),
    location: String(stay.location || ""),
    rating: Number(stay.rating || 0),
    reviews: Number(stay.reviews || 0),
    price: Number(stay.price || 0),
    img: stay.img || window.location.origin,
    desc: String(stay.description || ""),
    amenities: Array.isArray(stay.amenities) ? stay.amenities.map(String).slice(0, 50) : [],
    perks: Array.isArray(stay.highlights) ? stay.highlights.map(String).slice(0, 50) : []
  });

  const toggleFavourite = async stay => {
    if (!stay?.id || favouriteBusy) return;
    // Do not send a logged-in visitor to sign-in while the initial session
    // check is still in flight.
    if (!guestReady) return;
    if (!guestUser) {
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set("favorite", String(stay.id));
      window.location.assign("/login?returnTo=" + encodeURIComponent(returnUrl.pathname + returnUrl.search + returnUrl.hash));
      return;
    }
    const id = String(stay.id);
    const current = favourites.includes(id);
    setFavouriteBusy(true);
    setFavouriteNotice("");
    try {
      const response = await fetch(`${API_BASE}/favorites/${encodeURIComponent(id)}`, {
        method: current ? "DELETE" : "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        ...(current ? {} : { body: JSON.stringify({ propertySnapshot: propertySnapshot(stay) }) })
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        const returnUrl = new URL(window.location.href);
        returnUrl.searchParams.set("favorite", id);
        window.location.assign("/login?returnTo=" + encodeURIComponent(returnUrl.pathname + returnUrl.search + returnUrl.hash));
        return;
      }
      if (!response.ok) throw new Error(data.message || "Unable to update your saved stays.");
      setFavourites(items => current ? items.filter(item => item !== id) : [...new Set([...items, id])]);
      setFavouriteNotice(current ? "Stay removed from your favourites." : "Stay added to your favourites.");
    } catch (error) {
      setFavouriteNotice(error.message || "Unable to update your saved stays. Please try again.");
    } finally {
      setFavouriteBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL, { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (cancelled) return;
        // The homepage API returns published section settings under "content" and
        // uploaded property records separately at the response root. Merge them so
        // the cards use the real uploaded property images instead of sample-room fallbacks.
        setContent(data ? {
          ...(data.content || {}),
          featuredProperties: (Array.isArray(data.content?.featuredProperties) && data.content.featuredProperties.length)
            ? data.content.featuredProperties
            : (Array.isArray(data.featuredProperties) ? data.featuredProperties : (data.content?.featuredProperties || []))
        } : null);
      })
      .catch(() => { if (!cancelled) setContent(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const fallbackRooms = Array.isArray(content?.featuredRooms)
    ? content.featuredRooms.filter(stay => stay && stay.featured !== false).sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999))
    : [];

  // Real published properties are the source of truth. Sample featuredRooms
  // are only used when the API has no published property records at all.
  const hasPublishedProperties = Array.isArray(content?.featuredProperties) && content.featuredProperties.length > 0;
  const stays = hasPublishedProperties
    ? content.featuredProperties
        .filter(property => property && property.status === "PUBLISHED" && property.isFeatured !== false)
        .sort((a, b) => (a.featuredSortOrder ?? 999) - (b.featuredSortOrder ?? 999))
        .map((property, propertyIndex) => {
          const images = Array.isArray(property.images) ? [...property.images].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)) : [];
          // Keep every uploaded image URL so a stale/missing first upload does not
          // leave the whole card blank when another valid property image exists.
          const imageCandidates = [
            ...images.map(resolveImageUrl),
            resolveImageUrl(property.coverImage),
            resolveImageUrl(property.imageUrl),
            resolveImageUrl(property.featuredImage),
            resolveImageUrl(property.thumbnailUrl),
            resolveImageUrl(property.mainImage)
          ].filter(Boolean).filter((url, index, all) => all.indexOf(url) === index);
          return {
            id: property.id,
            name: property.title,
            type: property.propertyType,
            location: [property.address, property.city, property.state].filter(Boolean).join(", "),
            price: property.nightlyPrice,
            img: imageCandidates[0] || "",
            imageCandidates,
            // Use the configured homepage image only if every uploaded image for this property fails to load.
            fallbackImg: "",
            rating: property.rating,
            reviewCount: property.reviewCount,
            amenities: Array.isArray(property.amenities) ? property.amenities.slice(0, 3) : [],
            highlights: Array.isArray(property.highlights || property.propertyHighlights) ? (property.highlights || property.propertyHighlights).slice(0, 2) : [],
            verified: property.isVerified === true || property.verificationStatus === "VERIFIED",
            badge: property.badgeLabel || (property.isGuestFavourite || property.guestFavourite ? "Guest favourite" : property.isGreatLocation ? "Great location" : ""),
            url: property.url || property.href
              ? (((property.url || property.href).startsWith("http://") || (property.url || property.href).startsWith("https://")) || (property.url || property.href).startsWith("/") ? (property.url || property.href) : (property.url || property.href).startsWith("/") ? "" + (property.url || property.href) : "/" + (property.url || property.href))
              : "/property-details?id=" + encodeURIComponent(property.id),
            sortOrder: property.featuredSortOrder ?? 999
          };
        })
: [];
  useEffect(() => {
    const pendingId = pendingFavouriteRef.current;
    if (!guestReady || !guestUser || !pendingId || pendingFavouriteBusyRef.current || !stays.length) return;
    const stay = stays.find(item => String(item.id) === String(pendingId));
    if (!stay) return;
    pendingFavouriteBusyRef.current = true;
    (async () => {
      try {
        if (!favourites.includes(String(stay.id))) {
          const response = await fetch(`${API_BASE}/favorites/${encodeURIComponent(stay.id)}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json", ...csrfHeaders() },
            body: JSON.stringify({ propertySnapshot: propertySnapshot(stay) })
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.message || "Unable to save this stay.");
          setFavourites(items => [...new Set([...items, String(stay.id)])]);
        }
        setFavouriteNotice("Stay added to your favourites.");
        const query = new URLSearchParams(window.location.search);
        query.delete("favorite");
        window.history.replaceState({}, "", window.location.pathname + (query.toString() ? "?" + query.toString() : "") + window.location.hash);
        pendingFavouriteRef.current = "";
      } catch (error) {
        setFavouriteNotice(error.message || "Unable to save this stay. Please try again.");
      } finally {
        pendingFavouriteBusyRef.current = false;
      }
    })();
  }, [guestReady, guestUser, stays, favourites]);

  if (content?.featuredSectionEnabled === false) return null;

  const scroll = direction => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("[data-featured-stay-card]");
    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const distance = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.85;
    track.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  return (
    <section aria-labelledby="featured-stays-title" className="w-full bg-transparent pt-0 pb-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-3 sm:mb-8 md:items-end">
          <div className="max-w-3xl">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a7132]">
              {content?.featuredSectionEyebrow || "FIND YOUR SACRED STAY"}
            </span>
            <h2 id="featured-stays-title" className="text-2xl font-semibold tracking-tight text-[#212529] sm:text-3xl">
              {content?.featuredSectionTitle || "Book Your Stay"}
            </h2>
            {content?.featuredSectionDescription && (
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{content.featuredSectionDescription}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-3 sm:flex-row sm:items-center">
            {content?.featuredSectionViewAllEnabled !== false && content?.featuredSectionViewAllUrl && stays.length >= 4 && (
              <a href={content.featuredSectionViewAllUrl} className="inline-flex items-center gap-2 rounded-lg border border-[#2563a6] px-4 py-2.5 text-sm font-semibold text-[#2563a6] transition-colors hover:bg-[#2563a6] hover:text-white">
                {content?.featuredSectionViewAllLabel || "View all stays"}<span aria-hidden="true">→</span>
              </a>
            )}
            {stays.length > 1 && (
              <div className="flex items-center gap-2" aria-label="Stay carousel controls">
                <button type="button" onClick={() => scroll(-1)} aria-label="Previous stays" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-xl text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563a6]">
                  <span aria-hidden="true">←</span>
                </button>
                <button type="button" onClick={() => scroll(1)} aria-label="Next stays" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-xl text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563a6]">
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {favouriteNotice && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{favouriteNotice}</div>}
        {loading ? (
          <div className="flex gap-5 overflow-hidden" aria-label="Loading featured stays">
            {[0, 1, 2, 3].map(item => <div key={item} className="w-[min(280px,84vw)] shrink-0 overflow-hidden rounded-lg border border-slate-200 sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3.75rem)/4)]"><div className="h-48 animate-pulse bg-slate-100" /><div className="space-y-3 p-4"><div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-3 w-full animate-pulse rounded bg-slate-100" /></div></div>)}
          </div>
        ) : stays.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-600">
            {content?.featuredSectionEmptyMessage || "No featured stays are available yet. Select and publish properties in the Featured Rooms admin to display them here."}
          </div>
        ) : (
          <div ref={trackRef} className="roomo-featured-stays-track flex snap-x snap-mandatory gap-5 overflow-x-auto" aria-label="Featured stays carousel">
            {stays.map((stay, index) => (
              <article key={stay.id || stay.name || index} data-featured-stay-card className="group relative flex w-[min(280px,84vw)] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow duration-200 hover:shadow-lg sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3.75rem)/4)]">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100"><a href={stay.url || stay.href || "/properties"} className="absolute inset-0 block">{stay.img && <img src={stay.img} alt={stay.name || ""} loading="lazy" decoding="async" onError={event=>{const image=event.currentTarget,candidates=stay.imageCandidates||[],next=Number(image.dataset.imageCandidateIndex||0)+1;if(next<candidates.length){image.dataset.imageCandidateIndex=String(next);image.src=candidates[next];return;}if(stay.fallbackImg&&image.src!==stay.fallbackImg){image.src=stay.fallbackImg;return;}image.style.display="none";}} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"/>}</a>
                  {stay.verified&&<span className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm">✓ ROOMO verified</span>}
                  <button type="button" onClick={()=>toggleFavourite(stay)} aria-label={favourites.includes(String(stay.id))?`Remove ${stay.name||"stay"} from favourites`:`Add ${stay.name||"stay"} to favourites`} aria-pressed={favourites.includes(String(stay.id))} title={favourites.includes(String(stay.id))?"Remove from favourites":"Add to favourites"} disabled={!guestReady || favouriteBusy} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-slate-600 shadow-md hover:text-rose-500 disabled:cursor-wait disabled:opacity-60"><svg viewBox="0 0 24 24" className={`h-5 w-5 ${favourites.includes(String(stay.id))?"fill-rose-500 text-rose-500":"fill-transparent text-slate-700"}`} stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg></button>
                </div>
                <div className="flex min-h-[205px] flex-1 flex-col p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0">{stay.type&&<p className="mb-1 text-xs font-medium text-[#2563a6]">{stay.type}</p>}<a href={stay.url||stay.href||"/properties"} className="line-clamp-2 text-base font-semibold leading-6 text-[#212529] hover:text-[#2563a6]">{stay.name||""}</a></div><StarRatingDisplay value={stay.rating} count={stay.reviewCount} size={12} className="shrink-0 justify-end" /></div>
                  {stay.location&&<p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">⌖ {stay.location}</p>}
                  {Array.isArray(stay.amenities)&&stay.amenities.length>0&&<div className="mt-3 flex flex-wrap gap-1.5">{stay.amenities.slice(0,3).map((amenity,i)=><span key={`${amenity}-${i}`} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600">{String(amenity).toLowerCase().includes("wifi")?"Free Wi-Fi":amenity}</span>)}</div>}
                  <div className="mt-auto flex items-end justify-between gap-3 pt-4"><a href={stay.url||stay.href||"/properties"} className="inline-flex min-h-9 items-center rounded-lg border border-[#2563a6] px-3 py-2 text-xs font-semibold text-[#2563a6] hover:bg-blue-50">View stay →</a>{stay.price!=null&&Number(stay.price)>0&&<span className="whitespace-nowrap text-right text-sm text-slate-600"><strong className="text-base font-semibold text-[#212529]">₹{Number(stay.price).toLocaleString("en-IN")}</strong><span className="block text-xs text-slate-500">{content?.featuredPriceSuffix||"per night"}</span></span>}</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
