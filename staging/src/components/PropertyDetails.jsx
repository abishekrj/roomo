import { useEffect, useMemo, useState } from "react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

const API_ORIGIN = "http://localhost:5001";
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
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryEmail, setEnquiryEmail] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [enquiryState, setEnquiryState] = useState({ busy: false, message: "", success: false });

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

  const media = useMemo(() => {
    if (!property) return [];
    const gallery = normalizeList(property.gallery);
    const photos = normalizeList(property.images);
    const videos = normalizeList(property.videos);
    const combined = [...gallery, ...photos, ...videos]
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
  const currentMedia = media[activeMedia];
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
      message: enquiryMessage.trim()
    };
    try {
      const response = await fetch(API_ORIGIN + "/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-8">
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
                {rating != null && <span className="inline-flex items-center gap-1 rounded-lg bg-[#2563a6] px-2.5 py-1.5 text-sm font-semibold text-white">{Number(rating).toFixed(1)} <span aria-hidden="true">★</span></span>}
                {property.reviewCount != null && <span className="text-sm text-slate-500">{property.reviewCount} reviews</span>}
                {property.badgeLabel && <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">{property.badgeLabel}</span>}
                {property.isGuestFavourite && <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">Guest favourite</span>}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" onClick={() => { if (navigator.share) navigator.share({ title, url: window.location.href }).catch(() => {}); else if (navigator.clipboard) navigator.clipboard.writeText(window.location.href); }} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50">↗ Share</button>
              <a href="#enquiry" className="rounded-lg bg-[#2563a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4f86]">Enquire now</a>
            </div>
          </header>

          <section aria-label="Property photos and videos" className="mb-6">
            {media.length ? <div className="relative overflow-hidden rounded-lg" onClick={() => { setActiveMedia(0); setGalleryOpen(true); }}>
              <button type="button" onClick={event => { event.stopPropagation(); setActiveMedia(0); setGalleryOpen(true); }} className="relative block aspect-video w-full overflow-hidden bg-slate-100 text-left" aria-label="Open property photo gallery">
                {media[0]?.kind === "video" ? <div className="flex h-full w-full items-center justify-center bg-slate-900 text-5xl text-white">▶</div> : <img src={media[0]?.src} alt={media[0]?.alt || title} className="h-full w-full object-cover" onError={() => setFailedMedia(prev => ({...prev, [media[0]?.src]: true}))} />}
                {failedMedia[media[0]?.src] && <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-sm text-slate-500">Photo unavailable</div>}
              </button>
              {media.length > 1 && <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {media.slice(1).map((item, index) => <button type="button" key={item.src} onClick={event => { event.stopPropagation(); setActiveMedia(index + 1); setGalleryOpen(true); }} aria-label={"Open photo " + (index + 2)} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100 text-left">
                  {item.kind === "video" ? <div className="flex h-full w-full items-center justify-center bg-slate-800 text-3xl text-white">▶</div> : <img src={item.src} alt={item.alt || title + " photo " + (index + 2)} loading="lazy" className="h-full w-full object-cover" onError={() => setFailedMedia(prev => ({...prev, [item.src]: true}))} />}
                  {failedMedia[item.src] && <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-xs text-slate-500">Photo unavailable</div>}
                </button>)}
              </div>}
              <button type="button" onClick={event => { event.stopPropagation(); setActiveMedia(0); setGalleryOpen(true); }} className="absolute right-3 top-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50">▦ Show all photos & videos ({media.length})</button>
            </div> : <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">Property photos and videos will appear here when uploaded.</div>}
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

          <nav aria-label="On this page" className="sticky top-0 z-20 mb-8 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white/95 py-2 backdrop-blur">{sectionLink("overview","Overview")}{sectionLink("rooms","Rooms & prices")}{sectionLink("facilities","Facilities")}{sectionLink("enquiry","Enquire")}</nav>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-8">
              <section id="overview" className="scroll-mt-20">
                <h2 className="text-xl font-semibold">About this stay</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{description || "Discover this stay in Tiruvannamalai. Contact the property for details about the accommodation, check-in and available services."}</p>
                {property.highlights?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{property.highlights.map((item,index) => <span key={index} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">✓ {typeof item === "string" ? item : item?.name}</span>)}</div>}
                {property.checkInTime && <p className="mt-4 text-sm text-slate-600"><strong>Check-in:</strong> {property.checkInTime}{property.checkOutTime ? " · Check-out: " + property.checkOutTime : ""}</p>}
              </section>

              <section id="rooms" className="scroll-mt-20 border-t border-slate-200 pt-7">
                <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-semibold">Room types & prices</h2><p className="mt-1 text-sm text-slate-500">Choose your dates to help the property confirm availability.</p></div>{startingPrice != null && <p className="text-sm text-slate-500">From <strong className="text-lg text-[#212529]">{money(startingPrice)}</strong> <span>/ night</span></p>}</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">Check-in<input type="date" value={checkIn} min={new Date().toISOString().slice(0,10)} onChange={e => setCheckIn(e.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal"/></label>
                  <label className="text-sm font-medium text-slate-700">Check-out<input type="date" value={checkOut} min={checkIn || new Date().toISOString().slice(0,10)} onChange={e => setCheckOut(e.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal"/></label>
                </div>
                {roomTypes.length ? <div className="mt-4 space-y-3">{roomTypes.map((room,index) => {
                  const roomName = room?.name || room?.title || room?.roomType || "Room option " + (index + 1);
                  const price = room?.nightlyPrice ?? room?.price ?? room?.pricePerNight;
                  return <article key={room.id || roomName + index} className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center"><div><h3 className="font-semibold">{roomName}</h3>{(room.maxGuests || room.capacity) && <p className="mt-1 text-sm text-slate-500">👤 Up to {room.maxGuests || room.capacity} guests</p>}{room.description && <p className="mt-1 text-sm leading-6 text-slate-600">{room.description}</p>}{room.available === false && <p className="mt-1 text-xs font-medium text-amber-700">Availability to be confirmed</p>}</div><div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end"><strong className="text-lg">{money(price ?? startingPrice)}<span className="text-xs font-normal text-slate-500"> / night</span></strong><a href="#enquiry" className="rounded-lg bg-[#2563a6] px-3 py-2 text-sm font-semibold text-white">Enquire</a></div></article>;
                })}</div> : <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-medium">Room availability is confirmed by the property.</p><p className="mt-1 text-sm leading-6 text-slate-600">Send an enquiry with your dates, guest count and rooms requested to ask about current room options and rates.</p></div>}
              </section>

              <section id="facilities" className="scroll-mt-20 border-t border-slate-200 pt-7">
                <h2 className="text-xl font-semibold">Facilities & amenities</h2>
                {amenities.length ? <div className="mt-4 space-y-6">{amenityGroups.map(({ group, items }) => <div key={group || "other-facilities"}>{group && <h3 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-800">{group}</h3>}<div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((name,index) => <div key={name + index} className="flex items-start gap-2 text-sm text-slate-700"><span className="font-semibold text-emerald-700" aria-hidden="true">✓</span><span>{name}</span></div>)}</div></div>)}</div> : <p className="mt-3 text-sm leading-6 text-slate-600">Please contact the property to confirm available facilities and amenities.</p>}
              </section>
            </div>

            <aside id="enquiry" className="scroll-mt-20 lg:sticky lg:top-16">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9a7132]">Plan your stay</p>
                <h2 className="mt-1 text-xl font-semibold">Send an enquiry</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Ask about availability and get the latest rate directly from the property team.</p>
                <div className="mt-4 rounded-lg bg-slate-50 p-3"><p className="text-sm text-slate-500">Starting price</p><p className="mt-0.5 text-2xl font-semibold">{money(startingPrice)}{startingPrice != null && <span className="text-xs font-normal text-slate-500"> / night</span>}</p></div>
                <form onSubmit={submitEnquiry} className="mt-4 space-y-3">
                  <label className="block text-sm font-medium">Full name<input required value={enquiryName} onChange={e=>setEnquiryName(e.target.value)} autoComplete="name" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/></label>
                  <label className="block text-sm font-medium">Email address<input required type="email" value={enquiryEmail} onChange={e=>setEnquiryEmail(e.target.value)} autoComplete="email" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/></label>
                  <label className="block text-sm font-medium">Phone number<input required type="tel" value={enquiryPhone} onChange={e=>setEnquiryPhone(e.target.value)} autoComplete="tel" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/></label>
                  <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Adults<select value={adults} onChange={e=>setAdults(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">{[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n}</option>)}</select></label><label className="block text-sm font-medium">Rooms<select value={rooms} onChange={e=>setRooms(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></label></div>
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
    <Footer />
  </div>;
}
