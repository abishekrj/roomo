import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import SearchSection from "../components/SearchSection.jsx";
import { StarRatingDisplay, StarRatingPicker } from "../components/StarRating.jsx";

const API_ORIGIN = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api").replace(/\/api$/, "");
const PROPERTIES_API = API_ORIGIN + "/api/properties";

function imageUrl(value) {
  if (!value || typeof value !== "string") return "";
  const path = value.trim().replace(/\\\\/g, "/");
  if (!path) return "";
  if (/^(data:|blob:)/i.test(path)) return path;
  try {
    const url = new URL(path, API_ORIGIN);
    // Older uploads may have been saved with Vite's origin instead of the
    // Express server that actually serves /uploads.
    if (["localhost", "127.0.0.1"].includes(url.hostname) && url.port === "5173" && url.pathname.startsWith("/uploads/")) {
      url.protocol = "http:";
      url.hostname = "localhost";
      url.port = "5001";
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.href;
  } catch { return ""; }
}
function money(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? "₹" + n.toLocaleString("en-IN") : "Contact property";
}
function textValue(value) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}
function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}
function mediaKind(item) {
  const kind = String(item?.mediaType || item?.type || item?.kind || "").toLowerCase();
  const src = item?.videoUrl || item?.fileUrl || item?.mediaUrl || item?.imageUrl || item?.imagePath || item?.url || item?.path || item?.src || item?.thumbnailUrl || "";
  return kind.includes("video") || /\.(mp4|webm|mov)(\?|$)/i.test(src) ? "video" : "image";
}
function mediaSource(item) {
  return imageUrl(item?.videoUrl || item?.fileUrl || item?.mediaUrl || item?.imageUrl || item?.imagePath || item?.url || item?.path || item?.src || item?.thumbnailUrl);
}

export default function PropertyDetails() {
  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get("id");
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMedia, setActiveMedia] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [failedMedia, setFailedMedia] = useState({});
  const [checkIn, setCheckIn] = useState(params.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(params.get("checkOut") || "");
  const [adults, setAdults] = useState(Math.max(1, Number(params.get("adults") || 2)));
  const [rooms, setRooms] = useState(Math.max(1, Number(params.get("rooms") || 1)));
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryEmail, setEnquiryEmail] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [enquiryState, setEnquiryState] = useState({ busy: false, message: "", success: false });
  const [similarStays, setSimilarStays] = useState([]);
  const [favourite, setFavourite] = useState(false);
  const [favouriteNotice, setFavouriteNotice] = useState("");
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        let result = null;
        if (propertyId) {
          const direct = await fetch(PROPERTIES_API + "/" + encodeURIComponent(propertyId), { cache: "no-store", signal: controller.signal });
          if (direct.ok) {
            const json = await direct.json();
            result = json?.property || json?.data?.property || json?.data || json;
          } else if (direct.status !== 404) {
            // The list endpoint below is also supported for APIs that don't expose a single-property route.
          }
        }
        if (!result || !(result.id || result.title || result.name)) {
          const response = await fetch(PROPERTIES_API + "?limit=100&sort=newest", { cache: "no-store", signal: controller.signal });
          if (!response.ok) throw new Error("We couldn't load property details right now.");
          const json = await response.json();
          const list = Array.isArray(json) ? json : (json?.properties || json?.data?.properties || json?.data || []);
          result = normalizeList(list).find(item => String(item.id) === String(propertyId)) || null;
        }
        if (!result) throw new Error("This property could not be found. It may have been unpublished or the link may be incorrect.");
        setProperty(result);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Unable to load this property.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [propertyId]);

  useEffect(() => {
    if (!property?.id) return;
    const rawGuest = localStorage.getItem("roomoGuest");
    const token = rawGuest ? "cookie-session" : null;
    let guest = null;
    try { guest = rawGuest ? JSON.parse(rawGuest) : null; } catch { guest = null; }
    const storageKey = "roomoFavourites:" + String(guest?.id || guest?.guestId || guest?.email || "guest");
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { saved = []; }
    const pending = new URLSearchParams(window.location.search).get("favorite");
    if (Array.isArray(saved) && saved.map(String).includes(String(property.id))) setFavourite(true);
    if (token && guest && pending === String(property.id)) {
      const next = Array.isArray(saved) ? saved.map(String) : [];
      if (!next.includes(String(property.id))) next.push(String(property.id));
      localStorage.setItem(storageKey, JSON.stringify(next));
      setFavourite(true);
      setFavouriteNotice("This stay has been added to your favourites.");
      const url = new URL(window.location.href);
      url.searchParams.delete("favorite");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  }, [property?.id]);

  useEffect(() => {
    if (!property?.id) return;
    const controller = new AbortController();
    fetch(PROPERTIES_API + "?limit=50&sort=newest", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Unable to load similar stays");
        return response.json();
      })
      .then(json => {
        const list = Array.isArray(json) ? json : (json?.properties || json?.data?.properties || json?.data || []);
        const sameArea = normalizeList(list).filter(item => String(item.id) !== String(property.id) && String(item.status || "PUBLISHED").toUpperCase() === "PUBLISHED")
          .sort((a, b) => Number(String(b.city || "").toLowerCase() === String(property.city || "").toLowerCase()) - Number(String(a.city || "").toLowerCase() === String(property.city || "").toLowerCase()));
        setSimilarStays(sameArea.slice(0, 3));
      })
      .catch(error => { if (error.name !== "AbortError") setSimilarStays([]); });
    return () => controller.abort();
  }, [property?.id, property?.city]);

  const media = useMemo(() => {
    if (!property) return [];
    const gallery = normalizeList(property.gallery);
    const savedMedia = normalizeList(property.media);
    const photos = normalizeList(property.images);
    const videos = normalizeList(property.videos);
    const combined = [...gallery, ...savedMedia, ...photos, ...videos]
      .map(item => typeof item === "string" ? { url: item } : item)
      .map(item => ({ ...item, src: mediaSource(item), kind: mediaKind(item) }))
      .filter(item => item.src);
    return combined.filter((item, index, arr) => arr.findIndex(other => other.src === item.src) === index);
  }, [property]);
  const amenities = useMemo(() => {
    const values = property?.amenities || property?.facilities || [];
    const categoryFor = name => {
      const value = String(name || "").trim().toLowerCase();
      const categories = [
        ["Parking", ["parking", "street parking", "accessible parking", "valet parking", "electric vehicle charging"]],
        ["Internet", ["wifi", "wi-fi", "internet", "broadband"]],
        ["Kitchen", ["kitchen", "kitchenette", "refrigerator", "fridge", "microwave", "oven", "stovetop", "kettle", "toaster", "dining table", "cooking", "tea/coffee"]],
        ["Bedroom", ["bed linen", "linen", "wardrobe", "closet", "alarm clock", "extra long beds"]],
        ["Bathroom", ["bathroom", "toilet", "shower", "bathtub", "bath or shower", "towels", "hairdryer", "toilet paper", "free toiletries", "bathrobe", "slippers"]],
        ["Media & technology", ["tv", "television", "flat-screen", "cable channels", "satellite channels", "streaming service", "telephone", "radio"]],
        ["Room amenities", ["air conditioning", "heating", "fan", "soundproof", "iron", "desk", "sofa", "seating area", "tile/marble", "private entrance", "clothes rack", "socket near the bed"]],
        ["Food & drink", ["restaurant", "bar", "breakfast", "room service", "minibar", "coffee", "food", "dining"]],
        ["Services", ["front desk", "housekeeping", "laundry", "dry cleaning", "luggage storage", "concierge", "airport shuttle", "shuttle service", "wake-up service"]],
        ["Safety & security", ["safe", "smoke alarm", "fire extinguisher", "security", "cctv", "carbon monoxide", "key card", "24-hour security"]],
        ["Accessibility", ["lift", "elevator", "wheelchair", "accessible", "upper floors"]],
        ["Outdoor & view", ["balcony", "terrace", "garden", "patio", "view", "outdoor furniture", "sun terrace"]],
        ["General", ["family rooms", "non-smoking", "designated smoking", "pet-friendly", "pets allowed"]]
      ];
      return categories.find(([, keywords]) => keywords.some(keyword => value === keyword || value.includes(keyword)))?.[0] || "Other facilities";
    };
    const normalizeItem = (item, fallbackGroup = "") => {
      if (typeof item === "string" || typeof item === "number") {
        const name = String(item).trim();
        return name ? { name, group: fallbackGroup || categoryFor(name) } : null;
      }
      if (!item || typeof item !== "object") return null;
      const name = item.name || item.label || item.title || item.facilityName;
      if (!name) return null;
      const explicitGroup = String(item.group || item.category || item.categoryName || item.section || item.groupName || fallbackGroup || "").trim();
      return { name: String(name), group: explicitGroup || categoryFor(name) };
    };
    if (Array.isArray(values)) return values.map(item => normalizeItem(item)).filter(Boolean);
    if (values && typeof values === "object") {
      return Object.entries(values).flatMap(([group, items]) => {
        const list = Array.isArray(items) ? items : items && typeof items === "object" ? Object.values(items) : [];
        return list.map(item => normalizeItem(item, group)).filter(Boolean);
      });
    }
    return [];
  }, [property]);
  const amenityGroups = useMemo(() => {
    const groups = new Map();
    amenities.forEach(item => {
      const group = item.group || "";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(item.name);
    });
    return Array.from(groups, ([group, items]) => ({ group, items }));
  }, [amenities]);
  const roomTypes = normalizeList(property?.roomTypes || property?.rooms);
  const title = textValue(property?.title || property?.name) || "Property details";
  const location = [property?.address, property?.locality, property?.city, property?.state].filter(Boolean).join(", ");
  const description = textValue(property?.description || property?.overview || property?.about);
  const rating = property?.rating ?? property?.averageRating;
  const startingPrice = property?.nightlyPrice ?? property?.startingPrice ?? property?.price;
  const policyData = property?.policies && typeof property.policies === "object" ? property.policies : {};
  const selectedRoom = roomTypes.find((room, index) => String(room.id || room.name || index) === selectedRoomId) || roomTypes[0] || null;
  const selectedRoomPrice = selectedRoom?.nightlyPrice ?? selectedRoom?.price ?? selectedRoom?.pricePerNight ?? startingPrice;
  const stayNights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((new Date(checkOut + "T00:00:00Z") - new Date(checkIn + "T00:00:00Z")) / 86400000)
    : 0;
  const estimatedTotal = stayNights > 0 && Number.isFinite(Number(selectedRoomPrice)) && Number(selectedRoomPrice) > 0
    ? Number(selectedRoomPrice) * stayNights * rooms
    : null;
  const currentMedia = media[activeMedia];
  const nearbyLabels = {
    "annamalaiyar-temple": "Annamalaiyar Temple",
    "sri-ramanasramam": "Sri Ramanasramam",
    "girivalam-path": "Girivalam pathway",
    "arunachala-hill": "Arunachala Hill",
    "skandashramam": "Skandashramam",
    "virupaksha-cave": "Virupaksha Cave",
    "sathanur-dam": "Sathanur Dam",
    "central-bus-stand": "Central bus stand",
    "railway-station": "Railway station",
    "yogi-ram-surathkumar-ashram": "Yogi Ramsuratkumar Ashram"
  };
  const nearbyPlaces = normalizeList(property?.nearbyLandmarks).map(place => {
    const rawName = typeof place === "string" ? place : place?.name || place?.title || "";
    return { rawName, name: nearbyLabels[rawName] || rawName, distance: typeof place === "object" ? place?.distance || place?.distanceText || "" : "", address: typeof place === "object" ? place?.address || "" : "" };
  }).filter(place => place.name);
  const mapQuery = property?.latitude && property?.longitude ? property.latitude + "," + property.longitude : (property?.mapLocation || location);
  const mapHref = property?.mapUrl || property?.googleMapsUrl || (mapQuery ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(mapQuery) : "");
  const directionsHref = mapQuery ? "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(mapQuery) : "";
  const toggleFavourite = () => {
    const token = sessionStorage.getItem("roomoGuestToken") || localStorage.getItem("roomoGuestToken");
    const rawGuest = sessionStorage.getItem("roomoGuest") || localStorage.getItem("roomoGuest");
    let guest = null;
    try { guest = rawGuest ? JSON.parse(rawGuest) : null; } catch { guest = null; }
    if (!token || !guest) {
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set("favorite", String(property.id));
      window.location.assign("/staging/login?returnTo=" + encodeURIComponent(returnUrl.pathname + returnUrl.search + returnUrl.hash));
      return;
    }
    const key = "roomoFavourites:" + String(guest.id || guest.guestId || guest.email || "guest");
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(key) || "[]"); } catch { saved = []; }
    if (!Array.isArray(saved)) saved = [];
    const id = String(property.id);
    const next = saved.map(String).includes(id) ? saved.map(String).filter(item => item !== id) : [...saved.map(String), id];
    localStorage.setItem(key, JSON.stringify(next));
    const isSaved = next.includes(id);
    setFavourite(isSaved);
    setFavouriteNotice(isSaved ? "This stay has been added to your favourites." : "This stay has been removed from your favourites.");
  };
  async function openReviewForm() {
    setReviewNotice("");
    try {
      const response = await fetch((import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/guest-auth/me", { credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.user) {
        const returnTo = window.location.pathname + window.location.search + "#reviews";
        window.location.assign("/staging/login?returnTo=" + encodeURIComponent(returnTo));
        return;
      }
      setReviewRating(5);
      setReviewComment("");
      setReviewFormOpen(true);
    } catch {
      setReviewNotice("We couldn't verify your session. Please sign in and try again.");
    }
  }

  async function submitReview(event) {
    event.preventDefault();
    if (!property?.id || reviewBusy) return;
    setReviewBusy(true);
    setReviewNotice("");
    try {
      const csrf = document.cookie.split("; ").find(part => part.startsWith("roomo_csrf="));
      const response = await fetch((import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(csrf ? { "X-CSRF-Token": decodeURIComponent(csrf.slice("roomo_csrf=".length)) } : {}) },
        body: JSON.stringify({ propertyId: property.id, rating: reviewRating, comment: reviewComment.trim() })
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.assign("/staging/login?returnTo=" + encodeURIComponent(window.location.pathname + window.location.search + "#reviews"));
        return;
      }
      if (!response.ok) throw new Error(data.message || "Unable to submit your review.");
      setReviewNotice(data.message || "Thank you. Your review has been sent for approval.");
      setReviewComment("");
      setReviewFormOpen(false);
    } catch (error) {
      setReviewNotice(error.message || "Unable to submit your review.");
    } finally {
      setReviewBusy(false);
    }
  }

  useEffect(() => {
    if (!galleryOpen) return;
    const onKeyDown = event => {
      if (event.key === "Escape") setGalleryOpen(false);
      if (event.key === "ArrowRight") setActiveMedia(index => media.length ? (index + 1) % media.length : 0);
      if (event.key === "ArrowLeft") setActiveMedia(index => media.length ? (index - 1 + media.length) % media.length : 0);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [galleryOpen, media.length]);

  async function submitEnquiry(event) {
    event.preventDefault();
    if (!property?.id) return;
    if (!enquiryName.trim() || !enquiryEmail.trim() || !enquiryPhone.trim()) {
      setEnquiryState({ busy: false, message: "Please enter your name, email and phone number.", success: false });
      return;
    }
    setEnquiryState({ busy: true, message: "", success: false });
    const payload = {
      propertyId: property.id,
      propertyName: title,
      guestName: enquiryName.trim(),
      name: enquiryName.trim(),
      email: enquiryEmail.trim(),
      phone: enquiryPhone.trim(),
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      adults: Number(adults),
      rooms: Number(rooms),
      message: [
        selectedRoom ? "Preferred room: " + (selectedRoom.name || selectedRoom.title || "Selected room") : "",
        stayNights > 0 ? "Stay length: " + stayNights + (stayNights === 1 ? " night" : " nights") : "",
        estimatedTotal != null ? "Indicative room total: ₹" + estimatedTotal.toLocaleString("en-IN") + " (final price to be confirmed)" : "",
        enquiryMessage.trim()
      ].filter(Boolean).join("\n\n")
    };
    try {
      const response = await fetch(API_ORIGIN + "/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(() => { const item = document.cookie.split("; ").find(part => part.startsWith("roomo_csrf=")); return item ? { "X-CSRF-Token": decodeURIComponent(item.slice("roomo_csrf=".length)) } : {}; })() },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || "We couldn't send your enquiry. Please try again.");
      setEnquiryState({ busy: false, message: data.message || "Your enquiry has been sent. The property team can follow up with you.", success: true });
      setEnquiryName(""); setEnquiryEmail(""); setEnquiryPhone(""); setEnquiryMessage("");
    } catch (e) {
      setEnquiryState({ busy: false, message: e.message || "Enquiry could not be sent. Please try again.", success: false });
    }
  }

  const sectionLink = (id, label) => <a href={"#" + id} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-[#2563a6]">{label}</a>;

  return <div className="flex min-h-screen flex-col bg-white font-sans text-[#212529]">
    <Header />
    <main className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-12">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500"><a href="/staging/" className="hover:text-[#2563a6]">Home</a><span className="mx-2">/</span><a href="/staging/properties" className="hover:text-[#2563a6]">Stays</a><span className="mx-2">/</span><span className="text-slate-700">{title}</span></nav>
        {loading ? <div className="space-y-5" aria-label="Loading property details"><div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-100"/><div className="h-72 animate-pulse rounded-lg bg-slate-100"/><div className="h-32 animate-pulse rounded-lg bg-slate-100"/></div>
        : error ? <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-6"><h1 className="text-lg font-semibold">Property details unavailable</h1><p className="mt-2 text-sm text-slate-600">{error}</p><a href="/staging/properties" className="mt-4 inline-flex rounded-lg bg-[#2563a6] px-4 py-2.5 text-sm font-semibold text-white">Browse stays</a></div>
        : property && <>
          <header className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="min-w-0">
              {property.propertyType && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#9a7132]">{property.propertyType}</p>}
              <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{title}</h1>
              {location && <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600"><span aria-hidden="true">⌖</span><span>{location}</span></p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StarRatingDisplay value={rating} count={property.reviewCount} size={13} />
                {property.isVerified === true || String(property.verificationStatus || "").toUpperCase() === "VERIFIED" ? <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">✓ ROOMO verified</span> : null}
                {property.badgeLabel && <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">{property.badgeLabel}</span>}
                {property.isGuestFavourite && <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">Guest favourite</span>}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" onClick={toggleFavourite} aria-pressed={favourite} className={"rounded-lg border px-4 py-2.5 text-sm font-medium " + (favourite ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-700 hover:bg-slate-50")}>{favourite ? "♥ Saved" : "♡ Save stay"}</button>
              <button type="button" onClick={() => { if (navigator.share) navigator.share({ title, url: window.location.href }).catch(() => {}); else if (navigator.clipboard) { navigator.clipboard.writeText(window.location.href).then(() => setFavouriteNotice("Stay link copied to clipboard.")).catch(() => {}); } }} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50">↗ Share</button>
              <a href="#enquiry" className="rounded-lg bg-[#2563a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4f86]">Enquire now</a>
            </div>
          </header>

          {favouriteNotice && <p role="status" className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{favouriteNotice} <a href="/staging/my-bookings" className="ml-1 font-semibold underline">View favourites</a></p>}
          <section aria-label="Property photos and videos" className="mb-6">
            {media.length ? <div className="relative overflow-hidden rounded-lg">
              <div className="grid grid-cols-1 gap-2 md:aspect-[2.78/1] md:grid-cols-[1.78fr_1fr] md:gap-2">
                <button type="button" onClick={() => { setActiveMedia(0); setGalleryOpen(true); }} className="relative block aspect-video w-full overflow-hidden rounded-lg bg-slate-100 text-left md:aspect-auto md:h-full md:min-h-0 md:rounded-r-none" aria-label="Open property photo gallery">
                  {media[0]?.kind === "video" ? <div className="flex h-full min-h-56 w-full items-center justify-center bg-slate-900 text-5xl text-white">▶</div> : <img src={media[0]?.src} alt={media[0]?.alt || title} className="h-full w-full object-cover" onError={() => setFailedMedia(prev => ({...prev, [media[0]?.src]: true}))} />}
                  {failedMedia[media[0]?.src] && <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-sm text-slate-500">Photo unavailable</div>}
                </button>
                <div className="grid grid-cols-2 grid-rows-2 gap-2 overflow-hidden rounded-lg md:h-full md:rounded-l-none">
                  {[0, 1, 2, 3].map(slot => {
                    const item = media[slot + 1];
                    const remainingCount = Math.max(0, media.length - 5);
                    const showRemaining = slot === 3 && remainingCount > 0;
                    return item ? <button type="button" key={item.src} onClick={() => { setActiveMedia(slot + 1); setGalleryOpen(true); }} aria-label={showRemaining ? "Open all photos and videos, " + remainingCount + " more" : "Open photo " + (slot + 2)} className="relative aspect-square min-w-0 overflow-hidden bg-slate-100 text-left">
                      {item.kind === "video" ? <div className="flex h-full w-full items-center justify-center bg-slate-800 text-3xl text-white">▶</div> : <img src={item.src} alt={item.alt || title + " photo " + (slot + 2)} loading="lazy" className="h-full w-full object-cover" onError={() => setFailedMedia(prev => ({...prev, [item.src]: true}))} />}
                      {failedMedia[item.src] && <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-xs text-slate-500">Photo unavailable</div>}
                      {showRemaining && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-center text-white"><span className="text-2xl font-semibold">+{remainingCount}</span><span className="mt-1 text-xs font-medium">more photos</span></div>}
                    </button> : <div key={"empty-gallery-slot-" + slot} aria-hidden="true" className="aspect-square min-w-0 bg-slate-100" />;
                  })}
                </div>
              </div>
              <button type="button" onClick={() => { setActiveMedia(0); setGalleryOpen(true); }} className="absolute bottom-3 right-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50">▦ Show all photos & videos ({media.length})</button>
            </div>  : <div className="grid aspect-video grid-cols-1 overflow-hidden rounded-lg bg-slate-100 md:aspect-[2.78/1] md:grid-cols-[1.78fr_1fr]"><div aria-hidden="true" className="bg-slate-200" /><div className="grid grid-cols-2 grid-rows-2 gap-0">{[0, 1, 2, 3].map(slot => <div key={"empty-gallery-slot-" + slot} aria-hidden="true" className="aspect-square min-w-0 bg-slate-200" />)}</div></div>}
          </section>
          {galleryOpen && media.length > 0 && <div role="dialog" aria-modal="true" aria-label="Property photo gallery" className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 text-white" onMouseDown={event => { if (event.target === event.currentTarget) setGalleryOpen(false); }}>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/15 px-4 py-3 sm:px-6">
              <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-white/65">{activeMedia + 1} of {media.length} · Photos & videos</p></div>
              <button type="button" onClick={() => setGalleryOpen(false)} aria-label="Close gallery" className="rounded-lg border border-white/25 px-3 py-2 text-sm hover:bg-white/10">✕ Close</button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center gap-3 p-3 sm:gap-6 sm:p-6">
              <button type="button" aria-label="Previous image" onClick={() => setActiveMedia(index => (index - 1 + media.length) % media.length)} className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-2xl hover:bg-white/20">‹</button>
              <div className="flex h-full min-h-0 min-w-0 flex-1 items-center justify-center">
                {currentMedia?.kind === "video" ? <video key={currentMedia.src} src={currentMedia.src} controls autoPlay playsInline className="max-h-full max-w-full rounded-lg object-contain" /> : failedMedia[currentMedia?.src] ? <div className="text-sm text-white/70">This image could not be loaded.</div> : <img key={currentMedia?.src} src={currentMedia?.src} alt={currentMedia?.alt || title} className="max-h-full max-w-full rounded-lg object-contain" onError={() => setFailedMedia(prev => ({...prev, [currentMedia?.src]: true}))} />}
              </div>
              <button type="button" aria-label="Next image" onClick={() => setActiveMedia(index => (index + 1) % media.length)} className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-2xl hover:bg-white/20">›</button>
            </div>
            <div className="shrink-0 border-t border-white/15 px-3 py-3 sm:px-6">
              <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto pb-1">
                {media.map((item, index) => <button type="button" key={item.src} onClick={() => setActiveMedia(index)} aria-label={"Show item " + (index + 1)} aria-pressed={activeMedia === index} className={"relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 " + (activeMedia === index ? "border-white" : "border-transparent opacity-65 hover:opacity-100")}>
                  {item.kind === "video" ? <div className="flex h-full items-center justify-center bg-slate-800 text-xl">▶</div> : <img src={item.src} alt="" className="h-full w-full object-cover" onError={() => setFailedMedia(prev => ({...prev, [item.src]: true}))} />}
                  {failedMedia[item.src] && <span className="absolute inset-0 flex items-center justify-center bg-slate-700 text-[10px]">Unavailable</span>}
                </button>)}
              </div>
            </div>
          </div>}

          <nav aria-label="On this page" className="sticky top-0 z-20 mb-8 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white/95 py-2 backdrop-blur">{sectionLink("overview","Overview")}{sectionLink("rooms","Rooms & prices")}{sectionLink("facilities","Facilities")}{sectionLink("location","Location")}{sectionLink("reviews","Reviews")}{sectionLink("policies","Policies")}{sectionLink("enquiry","Enquire")}</nav>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-8">
              <section id="overview" className="scroll-mt-20">
                <h2 className="text-xl font-semibold">About this stay</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{description || "Discover this stay in Tiruvannamalai. Contact the property for details about the accommodation, check-in and available services."}</p>
                {property.highlights?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{property.highlights.map((item,index) => <span key={index} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">✓ {typeof item === "string" ? item : item?.name}</span>)}</div>}
                {property.checkInTime && <p className="mt-4 text-sm text-slate-600"><strong>Check-in:</strong> {property.checkInTime}{property.checkOutTime ? " · Check-out: " + property.checkOutTime : ""}</p>}
              </section>

              <section id="rooms" className="scroll-mt-20 border-t border-slate-200 pt-7">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div><h2 className="text-xl font-semibold">Choose your room</h2><p className="mt-1 text-sm text-slate-500">Select dates and a room to see an estimated stay total.</p></div>
                  {startingPrice != null && <p className="text-sm text-slate-500">From <strong className="text-lg text-[#212529]">{money(startingPrice)}</strong> <span>/ night</span></p>}
                </div>
                <div className="mt-4">
                  <SearchSection
                    variant="inline"
                    initialValues={{ destination: property.locality || property.city || "Tiruvannamalai", checkIn, checkOut, adults, rooms }}
                    onSearch={({ checkIn: nextCheckIn, checkOut: nextCheckOut, adults: nextAdults, rooms: nextRooms }) => {
                      setCheckIn(nextCheckIn);
                      setCheckOut(nextCheckOut);
                      setAdults(nextAdults);
                      setRooms(nextRooms);
                    }}
                  />
                </div>
                {stayNights > 0 && <p className="mt-3 text-sm text-slate-600"><strong className="text-slate-900">{stayNights} {stayNights===1?"night":"nights"}</strong> · {adults} {adults===1?"adult":"adults"} · {rooms} {rooms===1?"room":"rooms"}</p>}
                {roomTypes.length ? <div className="mt-4 space-y-3">{roomTypes.map((room,index) => {
                  const roomName = room?.name || room?.title || room?.roomType || "Room option " + (index + 1);
                  const roomKey = String(room.id || room.name || index);
                  const price = room?.nightlyPrice ?? room?.price ?? room?.pricePerNight ?? startingPrice;
                  const capacity = Number(room?.maxGuests || room?.capacity || property?.maxGuests || 0);
                  const isSelected = selectedRoomId ? selectedRoomId === roomKey : index === 0;
                  const imageList = normalizeList(room?.imageUrls || room?.images);
                  const roomImage = imageList.length ? mediaSource(typeof imageList[0] === "string" ? { url: imageList[0] } : imageList[0]) : "";
                  const roomTotal = stayNights > 0 && Number.isFinite(Number(price)) && Number(price)>0 ? Number(price)*stayNights*rooms : null;
                  return <article key={room.id || roomName + index} className={"overflow-hidden rounded-lg border transition " + (isSelected ? "border-[#2563a6] bg-blue-50/40 ring-1 ring-[#2563a6]/20" : "border-slate-200 bg-white")}>
                    <div className="flex flex-col sm:flex-row">
                      {roomImage && <img src={roomImage} alt={roomName} loading="lazy" className="h-40 w-full object-cover sm:h-auto sm:w-36 sm:self-stretch" />}
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900">{roomName}</h3>
                          {capacity>0 && <p className="mt-1 text-sm text-slate-500">Up to {capacity} guests</p>}
                          {Array.isArray(room?.bedConfiguration) && room.bedConfiguration.length>0 && <p className="mt-1 text-sm text-slate-600">{room.bedConfiguration.map(b=>typeof b==="string"?b:b?.name||b?.type||"").filter(Boolean).join(" · ")}</p>}
                          {room.description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{room.description}</p>}
                          {Array.isArray(room?.facilities) && room.facilities.length>0 && <p className="mt-2 text-xs leading-5 text-slate-500">{room.facilities.slice(0,4).map(f=>typeof f==="string"?f:f?.name||f?.label||"").filter(Boolean).join(" · ")}</p>}
                          {room.quantity != null && <p className="mt-2 text-xs text-slate-500">Availability is confirmed by the property</p>}
                        </div>
                        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                          <div className="text-left sm:text-right"><strong className="text-lg text-slate-900">{money(price)}</strong><span className="text-xs font-normal text-slate-500"> / night</span>
                            {roomTotal != null && <p className="mt-1 text-xs text-slate-500">Estimated total: <strong className="text-slate-800">{money(roomTotal)}</strong></p>}
                          </div>
                          <button type="button" onClick={()=>{setSelectedRoomId(roomKey);document.getElementById("enquiry")?.scrollIntoView({behavior:"smooth",block:"start"});}} className={"inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 " + (isSelected ? "border border-[#2563a6] bg-white text-[#2563a6]" : "bg-[#2563a6] text-white hover:bg-[#1d4f86]")}>{isSelected ? "Selected" : "Select room"}</button>
                        </div>
                      </div>
                    </div>
                  </article>;
                })}</div> : <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-medium">Room availability is confirmed by the property.</p><p className="mt-1 text-sm leading-6 text-slate-600">Send an enquiry with your dates, guest count and rooms requested to ask about current room options and rates.</p></div>}
                {estimatedTotal != null && <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">Estimated stay total</p><p className="mt-1 text-xs leading-5 text-slate-600">{money(selectedRoomPrice)} × {stayNights} {stayNights===1?"night":"nights"} × {rooms} {rooms===1?"room":"rooms"}</p></div><p className="text-xl font-semibold text-slate-900">{money(estimatedTotal)}</p></div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Indicative room cost only. Taxes, extra charges and final availability must be confirmed by the property.</p>
                </div>}
              </section>

              <section id="facilities" className="scroll-mt-20 border-t border-slate-200 pt-7">
                <h2 className="text-xl font-semibold">Facilities & amenities</h2>
                {amenities.length ? <div className="mt-4 space-y-6">{amenityGroups.map(({ group, items }) => <div key={group || "other-facilities"}>{group && <h3 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-800">{group}</h3>}<div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((name,index) => <div key={name + index} className="flex items-start gap-2 text-sm text-slate-700"><span className="font-semibold text-emerald-700" aria-hidden="true">✓</span><span>{name}</span></div>)}</div></div>)}</div> : <p className="mt-3 text-sm leading-6 text-slate-600">Please contact the property to confirm available facilities and amenities.</p>}
              </section>

              <section id="location" className="scroll-mt-20 border-t border-slate-200 pt-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h2 className="text-xl font-semibold">Location & nearby places</h2><p className="mt-2 text-sm leading-6 text-slate-600">{location || "Location details will be shared by the property."}</p></div>
                  {directionsHref && <a href={directionsHref} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Get directions ↗</a>}
                </div>
                {nearbyPlaces.length > 0 ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{nearbyPlaces.map((place,index) => <article key={place.rawName || index} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-lg text-[#2563a6]" aria-hidden="true">⌖</span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-800">{place.name}</p>{place.distance ? <p className="mt-1 text-xs text-slate-500">{place.distance}</p> : <p className="mt-1 text-xs text-slate-500">Distance not provided by the property</p>}{(place.address || place.name) && <a href={"https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(place.address || place.name + ", Tiruvannamalai")} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-[#2563a6] hover:underline">Directions ↗</a>}</div></article>)}</div> : <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">Nearby places have not been added to this listing yet. Open the map to explore the surrounding area.</p>}
                {mapHref && <div className="mt-4 overflow-hidden rounded-lg border border-slate-200"><iframe title={"Map showing " + title} src={"https://maps.google.com/maps?q=" + encodeURIComponent(mapQuery) + "&output=embed"} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-64 w-full border-0" allowFullScreen /><div className="flex flex-wrap gap-3 border-t border-slate-200 p-3"><a href={mapHref} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#2563a6] hover:underline">Open map ↗</a>{directionsHref && <a href={directionsHref} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#2563a6] hover:underline">Plan route ↗</a>}</div></div>}
                <div className="mt-4 rounded-lg bg-amber-50 p-4"><h3 className="text-sm font-semibold text-amber-950">Planning your visit</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-900"><li>During Pournami and major temple festivals, allow extra time for local travel and parking.</li><li>Confirm current temple access, Girivalam route conditions and any traffic restrictions before you set out.</li><li>Ask the property about parking, late arrival and the easiest approach road for your travel dates.</li></ul><p className="mt-2 text-xs leading-5 text-amber-800">Travel guidance only. Festival schedules, access and traffic arrangements can change; confirm current information locally.</p></div>
              </section>

              <section id="reviews" className="scroll-mt-20 border-t border-slate-200 pt-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><h2 className="text-xl font-semibold">Guest reviews</h2><p className="mt-1 text-sm text-slate-500">Share your experience and help fellow pilgrims choose their stay.</p><div className="mt-2"><StarRatingDisplay value={rating} count={property.reviewCount} size={16} /></div></div>
                  <button type="button" onClick={openReviewForm} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#2563a6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e4f85] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"><span aria-hidden="true">✎</span> Write a review</button>
                </div>
                {reviewNotice && <p role="status" className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">{reviewNotice}</p>}
                {reviewFormOpen && <form onSubmit={submitReview} className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-semibold text-slate-900">How was your stay?</h3><p className="mt-1 text-sm text-slate-500">Your review will appear after ROOMO Super Admin approval.</p></div><button type="button" disabled={reviewBusy} onClick={() => setReviewFormOpen(false)} aria-label="Close review form" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 focus:outline-none">✕</button></div>
                  <fieldset className="mt-4"><legend className="text-sm font-semibold text-slate-800">Your rating</legend><div className="mt-2 flex flex-wrap items-center gap-3"><StarRatingPicker value={reviewRating} onChange={setReviewRating} disabled={reviewBusy} /><span className="text-sm font-semibold text-slate-700">{Number(reviewRating).toFixed(1)} / 5</span></div><p className="mt-1 text-xs text-slate-500">Tap the left or right half of a star to choose half-star ratings.</p></fieldset>
                  <label className="mt-4 block text-sm font-semibold text-slate-800">Your review<textarea required minLength={10} maxLength={2000} rows={5} value={reviewComment} onChange={event => setReviewComment(event.target.value)} placeholder="What did you like about the location, rooms, cleanliness or hospitality?" className="mt-2 block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-normal outline-none focus:border-[#2563a6] focus:ring-2 focus:ring-amber-100" /></label>
                  <p className="mt-1 text-right text-xs text-slate-400">{reviewComment.length}/2000 characters</p>
                  <div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" disabled={reviewBusy} onClick={() => setReviewFormOpen(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</button><button type="submit" disabled={reviewBusy || reviewComment.trim().length < 10} className="rounded-lg bg-[#2563a6] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{reviewBusy ? "Submitting…" : "Submit review"}</button></div>
                </form>}
                {Array.isArray(property.reviews) && property.reviews.length > 0 ? <div className="mt-4 grid gap-3 md:grid-cols-2">{property.reviews.map((review,index) => <article key={review.id || index} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold">{review.guestName || review.name || "Guest"}</p>{review.verifiedStay === true && <span className="mt-1 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">✓ Verified stay</span>}</div>{review.rating != null && <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-[#2563a6]">{review.rating} ★</span>}</div><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{review.comment || review.text || review.review || ""}</p>{review.ownerResponse && <div className="mt-3 rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-700">Response from property</p><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{typeof review.ownerResponse === "string" ? review.ownerResponse : review.ownerResponse.message || review.ownerResponse.text || ""}</p></div>}{review.createdAt && <p className="mt-3 text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>}</article>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5"><p className="text-sm font-medium text-slate-700">No guest reviews yet</p><p className="mt-1 text-sm leading-6 text-slate-500">ROOMO will show verified-stay feedback here when review data is available. No ratings or reviews are displayed unless they are supplied by the property data.</p></div>}
                {property.reviewScores && typeof property.reviewScores === "object" && Object.entries(property.reviewScores).filter(([,score]) => Number.isFinite(Number(score))).length > 0 && <div className="mt-4 rounded-lg border border-slate-200 p-4"><h3 className="text-sm font-semibold">Category scores</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{Object.entries(property.reviewScores).filter(([,score]) => Number.isFinite(Number(score))).map(([label,score]) => <div key={label} className="flex items-center justify-between gap-3 text-sm"><span className="capitalize text-slate-600">{label.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ")}</span><span className="font-semibold text-slate-800">{Number(score).toFixed(1)} / 10</span></div>)}</div></div>}
                {property.ownerResponse && <div className="mt-4 rounded-lg border border-slate-200 p-4"><h3 className="text-sm font-semibold">Response from property</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{typeof property.ownerResponse === "string" ? property.ownerResponse : property.ownerResponse.message || property.ownerResponse.text || ""}</p></div>}
                {property.updatedAt && <p className="mt-3 text-xs text-slate-500">Listing information last updated {new Date(property.updatedAt).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric"})}.</p>}
              </section>

              {similarStays.length > 0 && <section id="similar-stays" className="scroll-mt-20 border-t border-slate-200 pt-7"><div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-semibold">Similar stays nearby</h2><p className="mt-1 text-sm text-slate-500">Explore other published ROOMO properties{property.city ? " in " + property.city : ""}.</p></div><a href="/staging/properties" className="text-sm font-semibold text-[#2563a6] hover:underline">View all stays ↗</a></div><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{similarStays.map((stay,index) => { const stayImage = mediaSource(normalizeList(stay.images)[0] || normalizeList(stay.media)[0] || { url: "" }); const stayName = stay.title || stay.name || "ROOMO stay"; return <a key={stay.id || index} href={"/staging/property-details?id=" + encodeURIComponent(stay.id)} className="overflow-hidden rounded-lg border border-slate-200 transition hover:border-slate-300 hover:shadow-sm">{stayImage ? <img src={stayImage} alt={stayName} loading="lazy" className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-sm text-slate-500">Photo coming soon</div>}<div className="p-3"><p className="font-semibold text-slate-800">{stayName}</p><p className="mt-1 line-clamp-2 text-sm text-slate-500">{[stay.locality, stay.city].filter(Boolean).join(", ") || "Tiruvannamalai"}</p><p className="mt-2 text-sm font-semibold text-[#2563a6]">{money(stay.nightlyPrice ?? stay.startingPrice ?? stay.price)} <span className="font-normal text-slate-500">/ night</span></p></div></a>; })}</div></section>}

              {property.showPolicies !== false && <section id="policies" className="scroll-mt-20 border-t border-slate-200 pt-7">
                <h2 className="text-xl font-semibold">Property policies</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <article className="rounded-lg border border-slate-200 p-4"><h3 className="text-sm font-semibold">Check-in & check-out</h3><p className="mt-2 text-sm leading-6 text-slate-600">Check-in: {policyData.checkIn || property.checkInTime || "Please confirm with property"}</p><p className="text-sm leading-6 text-slate-600">Check-out: {policyData.checkOut || property.checkOutTime || "Please confirm with property"}</p></article>
                  <article className="rounded-lg border border-slate-200 p-4"><h3 className="text-sm font-semibold">Cancellation</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{policyData.cancellation || property.cancellationPolicy || property.cancellation || "Cancellation terms vary by property and room. Please confirm the applicable policy with the property before making arrangements."}</p></article>
                  <article className="rounded-lg border border-slate-200 p-4"><h3 className="text-sm font-semibold">Children & extra beds</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{policyData.children || property.childrenPolicy || "Please contact the property to confirm child occupancy and extra-bed arrangements."}</p></article>
                  <article className="rounded-lg border border-slate-200 p-4"><h3 className="text-sm font-semibold">Pets & smoking</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{[policyData.pets || property.petsPolicy, policyData.smoking || property.smokingPolicy].filter(Boolean).join("\n\n") || "Please check the property's rules before arrival."}</p></article>
                  <article className="rounded-lg border border-slate-200 p-4"><h3 className="text-sm font-semibold">Payment & booking terms</h3><div className="mt-2 space-y-2 text-sm leading-6 text-slate-600"><p>{property.allowPayAtProperty ? "Pay at the property is available." : "Payment arrangements should be confirmed with the property."}</p>{property.noCreditCardRequired && <p>No credit card is required to enquire.</p>}</div></article>
                </div>
              </section>}
            </div>

            <aside id="enquiry" className="scroll-mt-20 lg:sticky lg:top-16">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9a7132]">Plan your stay</p>
                <h2 className="mt-1 text-xl font-semibold">Send an enquiry</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Ask about availability and get the latest rate directly from the property team.</p>
                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <p className="text-sm text-slate-500">{estimatedTotal != null ? "Estimated stay total" : "Starting price"}</p>
                  <p className="mt-0.5 text-2xl font-semibold">{estimatedTotal != null ? money(estimatedTotal) : money(startingPrice)}{estimatedTotal == null && startingPrice != null && <span className="text-xs font-normal text-slate-500"> / night</span>}</p>
                  {estimatedTotal != null && <p className="mt-1 text-xs text-slate-500">{money(selectedRoomPrice)} × {stayNights} {stayNights===1?"night":"nights"} × {rooms} {rooms===1?"room":"rooms"}</p>}
                  <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm">
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Check-in</span><strong className="text-right">{checkIn || "Choose date"}</strong></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Check-out</span><strong className="text-right">{checkOut || "Choose date"}</strong></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Guests / rooms</span><strong className="text-right">{adults} {adults===1?"adult":"adults"} · {rooms} {rooms===1?"room":"rooms"}</strong></div>
                    {selectedRoom && <div className="flex justify-between gap-3"><span className="text-slate-500">Room</span><strong className="max-w-[60%] text-right">{selectedRoom.name || selectedRoom.title || "Selected room"}</strong></div>}
                  </div>
                  {estimatedTotal != null && <p className="mt-3 text-xs leading-5 text-slate-500">Estimate only; taxes, extra charges and final availability are confirmed by the property.</p>}
                </div>
                <form onSubmit={submitEnquiry} className="mt-4 space-y-3">
                  <label className="block text-sm font-medium">Full name<input required value={enquiryName} onChange={e=>setEnquiryName(e.target.value)} autoComplete="name" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/></label>
                  <label className="block text-sm font-medium">Email address<input required type="email" value={enquiryEmail} onChange={e=>setEnquiryEmail(e.target.value)} autoComplete="email" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/></label>
                  <label className="block text-sm font-medium">Phone number<input required type="tel" value={enquiryPhone} onChange={e=>setEnquiryPhone(e.target.value)} autoComplete="tel" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/></label>
                  <label className="block text-sm font-medium">Message (optional)<textarea rows="3" value={enquiryMessage} onChange={e=>setEnquiryMessage(e.target.value)} placeholder="Any preferences or questions?" className="mt-1 block w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/></label>
                  {enquiryState.message && <p role="status" className={"rounded-lg p-3 text-sm " + (enquiryState.success ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}>{enquiryState.message}</p>}
                  <button disabled={enquiryState.busy} type="submit" className="w-full rounded-lg bg-[#2563a6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4f86] disabled:cursor-wait disabled:opacity-60">{enquiryState.busy ? "Sending enquiry…" : "Send enquiry"}</button>
                  <p className="text-xs leading-5 text-slate-500">This is an enquiry, not a confirmed booking. Availability and final prices must be confirmed by the property.</p>
                </form>
              </div>
            </aside>
          </div>
        </>}
      </div>
    </main>
    {!loading && !error && property && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_18px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500">{estimatedTotal != null ? stayNights + (stayNights===1?" night":" nights") + " · " + rooms + (rooms===1?" room":" rooms") : "Starting from"}</p>
          <p className="truncate text-lg font-semibold text-slate-900">{money(estimatedTotal != null ? estimatedTotal : startingPrice)}{estimatedTotal == null && startingPrice != null && <span className="text-xs font-normal text-slate-500"> / night</span>}</p>
        </div>
        <a href="#enquiry" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#2563a6] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1d4f86] focus:outline-none focus:ring-2 focus:ring-blue-200">Send enquiry</a>
      </div>
    </div>}
    <Footer />
  </div>;
}
