import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import SearchSection from "../components/SearchSection.jsx";
import { StarRatingDisplay } from "../components/StarRating.jsx";

const API_URL = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/properties";
const LANDMARKS = [
  { value: "annamalaiyar-temple", label: "Annamalaiyar Temple" },
  { value: "sri-ramanasramam", label: "Sri Ramanasramam" },
  { value: "girivalam-path", label: "Girivalam pathway" },
  { value: "arunachala-hill", label: "Arunachala Hill" },
  { value: "central-bus-stand", label: "Central bus stand" },
  { value: "railway-station", label: "Railway station" }
];
const AMENITY_LABELS = {
  wifi: "Free Wi-Fi", "free wifi": "Free Wi-Fi", parking: "Free parking",
  ac: "Air conditioning", "air conditioning": "Air conditioning",
  breakfast: "Breakfast included", "breakfast included": "Breakfast included",
  "hot water": "24-hour hot water", hotwater: "24-hour hot water",
  "family rooms": "Family rooms", "private bathroom": "Private bathroom",
  "arunachala view": "Arunachala / temple view", "temple view": "Arunachala / temple view"
};
const normalize = value => String(value ?? "").trim().toLocaleLowerCase();
const amenityCategory = name => {
  const value = normalize(name);
  const categories = [
    ["Parking", ["parking", "street parking", "accessible parking", "valet parking", "electric vehicle charging"]],
    ["Internet", ["wifi", "wi-fi", "internet", "broadband"]],
    ["Kitchen", ["kitchen", "kitchenette", "refrigerator", "fridge", "microwave", "oven", "stovetop", "kettle", "toaster", "dining table", "cooking", "tea/coffee"]],
    ["Bedroom", ["bed linen", "linen", "wardrobe", "closet", "alarm clock", "extra long beds"]],
    ["Bathroom", ["bathroom", "toilet", "shower", "bathtub", "bath or shower", "towels", "hairdryer", "toilet paper", "free toiletries", "bathrobe", "slippers", "hot water"]],
    ["Media & technology", ["tv", "television", "flat-screen", "cable channels", "satellite channels", "streaming service", "telephone", "radio"]],
    ["Room amenities", ["air conditioning", "heating", "fan", "soundproof", "iron", "desk", "sofa", "seating area", "tile/marble", "private entrance", "clothes rack", "socket near the bed"]],
    ["Food & drink", ["restaurant", "bar", "breakfast", "room service", "minibar", "coffee", "food", "dining"]],
    ["Services", ["front desk", "housekeeping", "laundry", "dry cleaning", "luggage storage", "concierge", "airport shuttle", "shuttle service", "wake-up service"]],
    ["Safety & security", ["safe", "smoke alarm", "fire extinguisher", "security", "cctv", "carbon monoxide", "key card", "24-hour security"]],
    ["Accessibility", ["lift", "elevator", "wheelchair", "accessible", "upper floors"]],
    ["Outdoor & view", ["balcony", "terrace", "garden", "patio", "view", "outdoor furniture", "sun terrace", "arunachala"]],
    ["General", ["family rooms", "non-smoking", "designated smoking", "pet-friendly", "pets allowed", "hot water"]]
  ];
  return categories.find(([, keywords]) => keywords.some(keyword => value === keyword || value.includes(keyword)))?.[0] || "Other facilities";
};
const AMENITY_CATEGORY_ORDER = ["Parking", "Internet", "Kitchen", "Bedroom", "Bathroom", "Media & technology", "Room amenities", "Food & drink", "Services", "Safety & security", "Accessibility", "Outdoor & view", "General", "Other facilities"];
const arrayValue = value => Array.isArray(value) ? value : value && typeof value === "object" ? Object.values(value).filter(v => typeof v === "string") : [];
const formatPrice = value => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const propertyType = property => property.propertyType || "Stay";
const API_ORIGIN = "http://localhost:5001";
const resolvePropertyImage = item => {
  const raw = typeof item === "string" ? item : (
    item?.imageUrl || item?.imagePath || item?.fileUrl || item?.mediaUrl ||
    item?.thumbnailUrl || item?.url || item?.path || item?.src ||
    item?.filename || item?.fileName || item?.location || ""
  );
  if (typeof raw !== "string" || !raw.trim()) return "";
  const value = raw.trim().replace(/\\\\/g, "/");
  try {
    // Uploaded files are served by Express, not by Vite. If an older upload
    // record saved the Vite origin, keep its path but point it at the API server.
    const parsed = new URL(value, API_ORIGIN);
    if (["localhost", "127.0.0.1"].includes(parsed.hostname) && parsed.port === "5173" && parsed.pathname.startsWith("/uploads/")) {
      parsed.protocol = "http:";
      parsed.hostname = "localhost";
      parsed.port = "5001";
    }
    if (!/^https?:$/.test(parsed.protocol)) return "";
    return parsed.href;
  } catch {
    const path = value.replace(/^\.\//, "").replace(/^uploads\//i, "/uploads/");
    return path.startsWith("/") ? new URL(path, API_ORIGIN).href : "";
  }
};
const propertyImages = property => {
  const values = [
    ...(Array.isArray(property.images) ? property.images : []),
    property.coverImage, property.imageUrl, property.featuredImage,
    property.thumbnailUrl, property.mainImage, property.photo
  ];
  return [...new Set(values.map(resolvePropertyImage).filter(Boolean))];
};

function Icon({ name, className = "h-4 w-4" }) {
  const paths = {
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    sliders: <><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3"/><path d="M1 14h6m2-6h6m2 8h6"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    list: <><path d="M9 6h12M9 12h12M9 18h12"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></>,
    sort: <><path d="M4 6h16M7 12h10m-7 6h4"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    bed: <><path d="M2 4v16M22 4v16M2 14h20M2 9h6a4 4 0 0 1 4 4v1M12 10h6a4 4 0 0 1 4 4"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.pin}</svg>;
}

function FilterSection({ title, children }) {
  return <section className="border-b border-slate-200 py-5 first:pt-0 last:border-b-0"><h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3><div className="space-y-3">{children}</div></section>;
}

function CheckOption({ checked, onChange, label, count }) {
  return <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-600">
    <input type="checkbox" checked={checked} onChange={onChange} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#2563a6] focus:ring-[#2563a6]" />
    <span className="flex-1 leading-5">{label}</span>
    {count !== undefined && <span className="text-xs tabular-nums text-slate-400">{count}</span>}
  </label>;
}

function PropertyCard({ property, view, isFavourite, onToggleFavourite }) {
  const imageCandidates = propertyImages(property);
  const image = imageCandidates[0] || "";
  const amenities = arrayValue(property.amenities).slice(0, 4);
  const highlights = arrayValue(property.highlights || property.propertyHighlights || property.specialFeatures).slice(0, 2);
  const nearby = arrayValue(property.nearbyLandmarks);
  const distanceSource = property.landmarkDistances || property.distances || property.nearbyLandmarks;
  const sacredDistances = (Array.isArray(distanceSource) ? distanceSource : []).filter(item => item && typeof item === "object").map(item => ({ name: item.landmark || item.name || item.title || item.location, distance: item.distance || item.distanceText || item.approxDistance })).filter(item => item.name && item.distance && /Annamalaiyar|Ramanasramam|Girivalam|Arunachala/i.test(String(item.name))).slice(0, 3);
  const policies = property.showPolicies === false ? null : property.policies;
  const policyHighlights = policies && typeof policies === "object" ? [policies.cancellationPolicy && (typeof policies.cancellationPolicy === "string" ? policies.cancellationPolicy : policies.cancellationPolicy.label || policies.cancellationPolicy.summary), policies.paymentTerms && (typeof policies.paymentTerms === "string" ? policies.paymentTerms : policies.paymentTerms.label || policies.paymentTerms.summary), policies.childrenAllowed === true ? "Children welcome" : policies.childrenAllowed === false ? "Adults only" : null, policies.petsAllowed === true ? "Pets allowed" : policies.petsAllowed === false ? "No pets" : null].filter(Boolean).slice(0, 2) : [];
  const isVerified = property.isVerified === true || property.verificationStatus === "VERIFIED";
  const badgeLabel = isVerified ? "ROOMO verified" : (property.badgeLabel || (property.isGuestFavourite || property.guestFavourite ? "Guest favourite" : property.isFeatured ? "Popular choice" : property.isGreatLocation ? "Great location" : ""));
  const configuredHref = property.url || property.href;
  const href = configuredHref
    ? ((configuredHref.startsWith("http://") || configuredHref.startsWith("https://")) || configuredHref.startsWith("/staging/") ? configuredHref : configuredHref.startsWith("/") ? "/staging" + configuredHref : "/staging/" + configuredHref)
    : "/staging/property-details?id=" + encodeURIComponent(property.id);
  return <article className={"group relative min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md " + (view === "list" ? "grid sm:grid-cols-[240px_minmax(0,1fr)]" : "flex flex-col")}>
    <div className={"relative min-w-0 overflow-hidden bg-slate-100 " + (view === "list" ? "aspect-square w-full sm:aspect-square sm:min-h-0" : "aspect-[4/3]")}>
      <a href={href} className="absolute inset-0 block overflow-hidden">
        {image ? <img src={image} data-image-candidate-index="0" alt={property.title || "ROOMO stay"} loading="lazy" decoding="async" onError={event => {
          const img = event.currentTarget;
          const next = Number(img.dataset.imageCandidateIndex || 0) + 1;
          if (next < imageCandidates.length) { img.dataset.imageCandidateIndex = String(next); img.src = imageCandidates[next]; }
          else { img.style.display = "none"; img.parentElement?.parentElement?.querySelector("[data-image-fallback]")?.classList.remove("hidden"); }
        }} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /> : null}
      </a>
      <div data-image-fallback className={"absolute inset-0 grid min-h-48 place-items-center text-slate-400 pointer-events-none " + (image ? "hidden" : "")}><div className="text-center"><Icon name="bed" className="mx-auto mb-2 h-9 w-9"/><span className="text-xs">Property photos coming soon</span></div></div>
      {badgeLabel && <span className="pointer-events-none absolute left-3 top-3 z-[1] rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm">✦ {badgeLabel}</span>}
      <button type="button" onClick={() => onToggleFavourite(property)} aria-label={isFavourite ? `Remove ${property.title || "stay"} from favourites` : `Add ${property.title || "stay"} to favourites`} aria-pressed={isFavourite} title={isFavourite ? "Remove from favourites" : "Add to favourites"} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-600 shadow-md transition-all duration-200 hover:scale-105 hover:text-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500">
        <Icon name="heart" className={"h-5 w-5 transition-colors " + (isFavourite ? "fill-rose-500 text-rose-500" : "fill-transparent text-slate-600")} />
      </button>
    </div>
    <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium text-[#2563a6]">{propertyType(property)}</p>
          <a href={href} className="line-clamp-2 text-lg font-semibold leading-6 text-[#212529] hover:text-[#2563a6]">{property.title || "Sacred stay"}</a>
        </div>
        <StarRatingDisplay value={property.rating} count={property.reviewCount} size={12} className="shrink-0 justify-end" />
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-sm leading-6 text-slate-500"><Icon name="pin" className="mt-1 h-4 w-4 shrink-0"/><span>{[property.address, property.city, property.state].filter(Boolean).join(", ")}{property.distanceToLandmark ? ` · approx. ${property.distanceToLandmark}` : property.nearestLandmark ? ` · near ${property.nearestLandmark}` : ""}</span></p>
       {sacredDistances.length > 0 && <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600" aria-label="Distances to sacred places">{sacredDistances.map((item,index)=><span key={item.name+index}>⌖ {item.name}: <strong className="font-semibold text-slate-700">{item.distance}</strong></span>)}</div>}
      <div className="mt-4 flex flex-wrap gap-2">
        {amenities.map((item, index) => <span key={String(item) + index} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{AMENITY_LABELS[normalize(item)] || item}</span>)}
        {property.sacredViews && <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Sacred views</span>}
      </div>
      {highlights.length > 0 && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-emerald-700">{highlights.map((item, index) => <span key={String(item) + index}>✓ {item}</span>)}</div>}
      {policyHighlights.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{policyHighlights.map((item,index)=><span key={item+index} className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">{item}</span>)}</div>}
       <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4 mt-4">
         <div><span className="text-xs text-slate-500">Price per night</span>{Number(property.nightlyPrice)>0?<p className="mt-0.5 text-xl font-semibold text-[#212529]">₹{formatPrice(property.nightlyPrice)}<span className="text-xs font-normal text-slate-500"> / night</span></p>:<p className="mt-0.5 text-sm font-medium text-slate-700">Contact for price</p>}{property.reviewCount!=null&&Number(property.reviewCount)>0&&<p className="mt-1 text-xs text-slate-500">{property.reviewCount} {Number(property.reviewCount)===1?"review":"reviews"}</p>}</div>
         <div className="flex flex-wrap gap-2"><a href={href} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#2563a6] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#1e4f85] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563a6]">View rooms &amp; enquire <Icon name="arrow" className="h-4 w-4"/></a></div>
       </div>
        
    </div>
  </article>;
}

export default function PropertyListingPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialDestination = params.get("ss") || params.get("city") || "Tiruvannamalai";
  const initialGuests = Math.max(1, Number(params.get("group_adults") || 2) + Number(params.get("group_children") || 0));
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [destination, setDestination] = useState(initialDestination);
  const [minPrice, setMinPrice] = useState(params.get("minPrice") || "500");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") || "10000");
  const [guestCount, setGuestCount] = useState(initialGuests);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedLandmarks, setSelectedLandmarks] = useState([]);
  const [sort, setSort] = useState("recommended");
  const [view, setView] = useState("list");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [favourites, setFavourites] = useState([]);
  const [favouriteNotice, setFavouriteNotice] = useState("");

  const readGuestSession = () => {
    const raw = localStorage.getItem("roomoGuest");
    const token = raw ? "cookie-session" : null;
    let user = null;
    try { user = raw ? JSON.parse(raw) : null; } catch { user = null; }
    return { token, user };
  };
  const guestKey = user => String(user?.id || user?.guestId || user?.email || "guest");
  const favouritesStorageKey = user => "roomoFavourites:" + guestKey(user);

  useEffect(() => {
    const { user } = readGuestSession();
    if (!user) { setFavourites([]); return; }
    try {
      const stored = JSON.parse(localStorage.getItem(favouritesStorageKey(user)) || "[]");
      setFavourites(Array.isArray(stored) ? stored.map(String) : []);
    } catch { setFavourites([]); }
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const pendingId = query.get("favorite");
    if (!pendingId) return;
    const { token, user } = readGuestSession();
    if (!token || !user) return;
    const key = favouritesStorageKey(user);
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem(key) || "[]"); } catch { stored = []; }
    if (!Array.isArray(stored)) stored = [];
    if (!stored.map(String).includes(String(pendingId))) {
      stored.push(String(pendingId));
      localStorage.setItem(key, JSON.stringify(stored));
    }
    setFavourites(stored.map(String));
    setFavouriteNotice("This room has been successfully added to your favourite.");
    query.delete("favorite");
    const nextUrl = window.location.pathname + (query.toString() ? "?" + query.toString() : "") + window.location.hash;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  const toggleFavourite = property => {
    const { token, user } = readGuestSession();
    if (!token || !user) {
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set("favorite", String(property.id));
      window.location.assign("/staging/login?returnTo=" + encodeURIComponent(returnUrl.pathname + returnUrl.search + returnUrl.hash));
      return;
    }
    const id = String(property.id);
    const adding = !favourites.includes(id);
    const updated = adding ? [...favourites, id] : favourites.filter(item => item !== id);
    localStorage.setItem(favouritesStorageKey(user), JSON.stringify(updated));
    setFavourites(updated);
    setFavouriteNotice(adding ? "This room has been successfully added to your favourite." : "This room has been removed from your favourites.");
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch(API_URL + "?limit=50&sort=newest", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("We couldn’t load stays right now. Please try again.");
        return response.json();
      })
      .then(data => setProperties(Array.isArray(data.properties) ? data.properties : []))
      .catch(err => { if (err.name !== "AbortError") setError(err.message || "Unable to load stays."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const types = useMemo(() => [...new Set(properties.map(propertyType).filter(Boolean))].sort(), [properties]);
  const amenities = useMemo(() => {
    const found = new Map();
    properties.forEach(property => arrayValue(property.amenities).forEach(item => {
      const label = AMENITY_LABELS[normalize(item)] || String(item);
      if (label) found.set(normalize(label), label);
    }));
    return [...found.values()].sort((a, b) => a.localeCompare(b));
  }, [properties]);

  const visibleProperties = useMemo(() => {
    const destinationQuery = normalize(destination);
    const min = minPrice === "" ? 0 : Number(minPrice);
    const max = maxPrice === "" ? Number.POSITIVE_INFINITY : Number(maxPrice);
    const filtered = properties.filter(property => {
      const locationText = normalize([property.city, property.state, property.address, property.title, property.nearbyLandmarks].join(" "));
      if (destinationQuery && !locationText.includes(destinationQuery) && !destinationQuery.includes(normalize(property.city))) return false;
      if (Number(property.nightlyPrice) < min || Number(property.nightlyPrice) > max) return false;
      if (Number(property.maxGuests || 1) < guestCount) return false;
      if (selectedTypes.length && !selectedTypes.some(type => normalize(type) === normalize(propertyType(property)))) return false;
      const propertyAmenities = arrayValue(property.amenities).map(normalize);
      if (selectedAmenities.some(amenity => !propertyAmenities.includes(normalize(amenity)) && !propertyAmenities.some(item => normalize(AMENITY_LABELS[item] || item) === normalize(amenity)))) return false;
      const landmarks = arrayValue(property.nearbyLandmarks).map(normalize);
      if (selectedLandmarks.some(landmark => !landmarks.includes(normalize(landmark)))) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sort === "price-low") return Number(a.nightlyPrice) - Number(b.nightlyPrice);
      if (sort === "price-high") return Number(b.nightlyPrice) - Number(a.nightlyPrice);
      if (sort === "name") return String(a.title || "").localeCompare(String(b.title || ""));
      if (sort === "featured") return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) || Number(b.featuredSortOrder || 0) - Number(a.featuredSortOrder || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [properties, destination, minPrice, maxPrice, guestCount, selectedTypes, selectedAmenities, selectedLandmarks, sort]);

  const priceCeiling = useMemo(() => {
    const highestPrice = properties.reduce((highest, property) => Math.max(highest, Number(property.nightlyPrice || property.startingPrice || property.price || 0)), 0);
    return Math.max(10000, Math.ceil(highestPrice / 1000) * 1000);
  }, [properties]);
  const safeMinPrice = Math.min(Math.max(0, Number(minPrice || 0)), priceCeiling);
  const safeMaxPrice = Math.min(Math.max(0, Number(maxPrice || priceCeiling)), priceCeiling);
  const activeFilterCount = selectedTypes.length + selectedAmenities.length + selectedLandmarks.length + (minPrice !== "500" ? 1 : 0) + (maxPrice !== "10000" ? 1 : 0) + (guestCount !== initialGuests ? 1 : 0);
  const toggleValue = (setter, values, value) => setter(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  const clearFilters = () => { setMinPrice("500"); setMaxPrice("10000"); setGuestCount(initialGuests); setSelectedTypes([]); setSelectedAmenities([]); setSelectedLandmarks([]); };
  const filterPanel = <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
    <div className="mb-5 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><Icon name="sliders" className="h-4 w-4"/> Filters</h2><button type="button" onClick={clearFilters} className="text-xs font-semibold text-[#2563a6] hover:underline">Clear all</button></div>
    <FilterSection title="Price per night">
      <div className="relative mx-1 mb-5 mt-3 h-6">
        <div className="absolute left-0 right-0 top-2 h-1.5 rounded-full bg-slate-200"/>
        <div className="absolute top-2 h-1.5 rounded-full bg-[#2563a6]" style={{ left: `${(safeMinPrice / priceCeiling) * 100}%`, right: `${100 - (safeMaxPrice / priceCeiling) * 100}%` }}/>
        <input aria-label="Minimum price per night" type="range" min="0" max={priceCeiling} step="100" value={safeMinPrice} onChange={e => setMinPrice(String(Math.min(Number(e.target.value), safeMaxPrice)))} className="pointer-events-none absolute inset-0 h-6 w-full cursor-pointer appearance-none bg-transparent accent-[#2563a6] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#2563a6] [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#2563a6]"/>
        <input aria-label="Maximum price per night" type="range" min="0" max={priceCeiling} step="100" value={safeMaxPrice} onChange={e => setMaxPrice(String(Math.max(Number(e.target.value), safeMinPrice)))} className="pointer-events-none absolute inset-0 h-6 w-full cursor-pointer appearance-none bg-transparent accent-[#2563a6] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#2563a6] [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#2563a6]"/>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="block text-xs text-slate-500">Minimum (₹)<input type="number" min="0" max={safeMaxPrice} value={minPrice} onChange={e => setMinPrice(String(Math.min(Math.max(0, Number(e.target.value || 0)), safeMaxPrice)))} className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100"/></label>
        <label className="block text-xs text-slate-500">Maximum (₹)<input type="number" min={safeMinPrice} max={priceCeiling} value={maxPrice} onChange={e => setMaxPrice(String(Math.max(safeMinPrice, Math.min(priceCeiling, Number(e.target.value || 0)))))} className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100"/></label>
      </div>
    </FilterSection>
    <FilterSection title="Guests">
      <div className="flex items-center justify-between gap-3"><span className="text-sm text-slate-600">Guests</span><div className="flex items-center gap-3"><button type="button" onClick={() => setGuestCount(n => Math.max(1, n - 1))} disabled={guestCount <= 1} className="h-8 w-8 rounded-lg border border-slate-300 text-lg disabled:opacity-40">−</button><span className="w-4 text-center text-sm tabular-nums">{guestCount}</span><button type="button" onClick={() => setGuestCount(n => Math.min(100, n + 1))} className="h-8 w-8 rounded-lg border border-slate-300 text-lg">+</button></div></div>
    </FilterSection>
    {types.length > 0 && <FilterSection title="Stay type">{types.map(type => <CheckOption key={type} checked={selectedTypes.includes(type)} onChange={() => toggleValue(setSelectedTypes, selectedTypes, type)} label={type} count={properties.filter(p => normalize(propertyType(p)) === normalize(type)).length}/>)}</FilterSection>}
    {amenities.length > 0 && <FilterSection title="Amenities">{AMENITY_CATEGORY_ORDER.map(category => { const categoryAmenities = amenities.filter(amenity => amenityCategory(amenity) === category); if (!categoryAmenities.length) return null; return <div key={category} className="space-y-3"><h4 className="pt-1 text-xs font-semibold text-slate-700">{category}</h4>{categoryAmenities.map(amenity => <CheckOption key={amenity} checked={selectedAmenities.includes(amenity)} onChange={() => toggleValue(setSelectedAmenities, selectedAmenities, amenity)} label={amenity} count={properties.filter(property => arrayValue(property.amenities).some(item => normalize(AMENITY_LABELS[normalize(item)] || item) === normalize(amenity))).length}/>)}</div>; })}</FilterSection>}
    <FilterSection title="Near landmarks">{LANDMARKS.map(landmark => <CheckOption key={landmark.value} checked={selectedLandmarks.includes(landmark.value)} onChange={() => toggleValue(setSelectedLandmarks, selectedLandmarks, landmark.value)} label={landmark.label}/>)}</FilterSection>
    <button type="button" onClick={() => setMobileFiltersOpen(false)} className="mt-4 w-full rounded-lg bg-[#2563a6] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1e4f85] lg:hidden">Show {visibleProperties.length} stays</button>
  </div>;

  return <div className="flex min-h-screen flex-col bg-[#f8fafc] font-sans text-[#212529]">
    <Header/>
    <main className="flex-1">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs text-slate-500"><a href="/" className="hover:text-[#2563a6]">Home</a><span>/</span><span className="text-slate-700">Blessed Stays</span></nav>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a7132]">FIND YOUR SACRED SANCTUARY</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Stays in {destination || "Tiruvannamalai"} — Find Your Sacred Sanctuary</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Hand-curated stays for a peaceful pilgrimage near Arunachala.</p></div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">{params.get("checkin") && params.get("checkout") ? params.get("checkin") + " – " + params.get("checkout") : "Choose your dates"}</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">{guestCount} guests</span>
            </div>
          </div>
        </div>
      </div>
      <SearchSection variant="default" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden"><button type="button" onClick={() => setMobileFiltersOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold"><Icon name="sliders"/> Filters {activeFilterCount > 0 && <span className="rounded-full bg-[#2563a6] px-1.5 text-xs text-white">{activeFilterCount}</span>}</button><span className="text-xs text-slate-500">{visibleProperties.length} stays</span></div>
        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-8">
          <aside className="hidden lg:block lg:sticky lg:top-24">{filterPanel}</aside>
          <section aria-labelledby="listing-results-title" className="min-w-0">
            <div className="mb-4 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 id="listing-results-title" className="text-lg font-semibold text-slate-900">Hotels, Ashrams and Heritage Stays</h2><p className="mt-1 text-xs text-slate-500">{loading ? "Finding available stays…" : `Showing ${visibleProperties.length} of ${properties.length} published stays`}</p></div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-500"><Icon name="sort" className="h-4 w-4"/><span>Sort by</span><select value={sort} onChange={e => setSort(e.target.value)} className="max-w-[180px] rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-[#2563a6]"><option value="recommended">Recommended</option><option value="featured">Featured first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Property name</option></select></label>
                <div className="flex items-center rounded-lg border border-slate-200 p-1" role="group" aria-label="Listing view">
                  <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold ${view === "list" ? "bg-[#2563a6] text-white" : "text-slate-600 hover:bg-slate-50"}`}><Icon name="list" className="h-4 w-4"/> List</button>
                  <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold ${view === "grid" ? "bg-[#2563a6] text-white" : "text-slate-600 hover:bg-slate-50"}`}><Icon name="grid" className="h-4 w-4"/> Grid</button>
                </div>
              </div>
            </div>

            {favouriteNotice && <div role="status" aria-live="polite" className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><span>{favouriteNotice}</span><button type="button" aria-label="Dismiss notification" onClick={() => setFavouriteNotice("")} className="rounded-lg px-2 py-1 font-semibold hover:bg-emerald-100">✕</button></div>}
            {error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error} <button type="button" onClick={() => window.location.reload()} className="ml-2 font-semibold underline">Try again</button></div> : loading ? <div className="space-y-4">{[0,1,2].map(i => <div key={i} className="h-56 animate-pulse rounded-lg border border-slate-200 bg-white"/>)}</div> : visibleProperties.length ? <div className={view === "list" ? "space-y-4" : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2"}>{visibleProperties.map(property => <PropertyCard key={property.id} property={property} view={view} isFavourite={favourites.includes(String(property.id))} onToggleFavourite={toggleFavourite}/>)}</div> : <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><p className="text-lg font-semibold text-slate-800">No stays match these filters</p><p className="mt-2 text-sm text-slate-500">Try widening your price range or removing a filter.</p><button type="button" onClick={clearFilters} className="mt-4 rounded-lg bg-[#2563a6] px-4 py-2.5 text-sm font-semibold text-white">Clear filters</button></div>}
          </section>
        </div>
      </div>

      {mobileFiltersOpen && <div className="fixed inset-0 z-[70] flex items-end bg-slate-900/50 lg:hidden" role="dialog" aria-modal="true" aria-label="Property filters" onClick={event => { if (event.target === event.currentTarget) setMobileFiltersOpen(false); }}><div className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-[#f8fafc] p-4"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Filters & amenities</h2><button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="rounded-lg border border-slate-200 bg-white p-2"><Icon name="close"/></button></div>{filterPanel}</div></div>}
    </main>
    <Footer/>
  </div>;
}
