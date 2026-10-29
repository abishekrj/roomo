import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";
const API = `${API_BASE}/gallery`;
const API_ORIGIN = new URL(API_BASE).origin;
function resolveImageUrl(value) {
  if (!value || typeof value !== "string") return "";
  const raw = value.trim().replace(/\\\\/g, "/");
  if (!raw) return "";
  if (/^(data:|blob:)/i.test(raw)) return raw;
  try {
    const url = new URL(raw, API_ORIGIN);
    if (["localhost", "127.0.0.1"].includes(url.hostname) && url.port !== "5001" && url.pathname.startsWith("/uploads/")) {
      url.protocol = "http:";
      url.hostname = "localhost";
      url.port = "5001";
    }
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(API, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load gallery");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Visual Stories is a photo gallery. YouTube and other video entries are not displayed here.
  const photos = useMemo(() => items.filter((item) => item.type === "IMAGE" && resolveImageUrl(item.mediaUrl)), [items]);
  const selected = selectedIndex === null ? null : photos[selectedIndex];

  const showPrevious = () => setSelectedIndex((current) => current === null ? null : (current - 1 + photos.length) % photos.length);
  const showNext = () => setSelectedIndex((current) => current === null ? null : (current + 1) % photos.length);

  useEffect(() => {
    if (selectedIndex === null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIndex, photos.length]);

  const moveCarousel = (direction) => {
    const element = carouselRef.current;
    if (!element) return;
    const firstCard = element.querySelector("[data-gallery-card]");
    const gap = 16;
    const amount = firstCard ? firstCard.getBoundingClientRect().width + gap : element.clientWidth;
    element.scrollBy({ left: amount * direction * (window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1), behavior: "smooth" });
  };

  return (
    <section aria-labelledby="roomo-gallery-title" className="w-full bg-transparent pt-0 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7 flex items-end justify-between gap-3 sm:mb-9 sm:gap-5">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#2563A6] sm:text-sm">Visual stories</p>
            <h2 id="roomo-gallery-title" className="text-2xl font-semibold leading-tight tracking-tight text-[#212529] sm:text-3xl lg:text-4xl">Gallery</h2>
            <p className="mt-3 text-sm leading-6 text-[#5F6670] sm:text-base sm:leading-7">Explore sacred places and memorable moments from Tiruvannamalai.</p>
          </div>
          {!loading && photos.length > 1 && (
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => moveCarousel(-1)} aria-label="Previous gallery photos" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D9E0E8] bg-white text-[#2563A6] transition hover:border-[#2563A6] hover:bg-[#2563A6] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A6]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button type="button" onClick={() => moveCarousel(1)} aria-label="Next gallery photos" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D9E0E8] bg-white text-[#2563A6] transition hover:border-[#2563A6] hover:bg-[#2563A6] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A6]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading gallery">
            {[1, 2, 3, 4].map((number) => <div key={number} className="aspect-[4/3] animate-pulse rounded-lg bg-slate-200" />)}
          </div>
        ) : photos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#D9E0E8] bg-white px-6 py-12 text-center text-sm text-[#5F6670]">
            Gallery photos will appear here soon.
          </div>
        ) : (
          <div ref={carouselRef} className="flex items-stretch snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Gallery photo carousel">
            {photos.map((item, index) => (
              <button key={item.id || item.title || index} data-gallery-card type="button" onClick={() => setSelectedIndex(index)}
                className="group flex h-full w-[calc(100%-1rem)] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-[#E3E8EF] bg-white text-left shadow-sm transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A6] focus-visible:ring-offset-2 sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/4)]"
                aria-label={`Open photo: ${item.title || "Gallery photo"}`}>
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#EAF0F7]">
                  <img src={resolveImageUrl(item.thumbnailUrl) || resolveImageUrl(item.mediaUrl)} alt={item.title || "ROOMO gallery photo"} loading="lazy" onError={(event) => { const image = event.currentTarget; const media = resolveImageUrl(item.mediaUrl); if (media && image.src !== media) { image.src = media; return; } image.style.display = "none"; }} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/10">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#2563A6] opacity-0 shadow transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /><path d="M11 8v6M8 11h6" /></svg>
                    </span>
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-1 min-h-5 text-sm font-semibold text-[#212529] sm:text-base">{item.title || "Visual story"}</h3>
                  {item.description && <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-[#5F6670]">{item.description}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#101820]/85 p-3 sm:p-6" role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedIndex(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="roomo-gallery-dialog-title" className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
              <div>
                <h3 id="roomo-gallery-dialog-title" className="text-lg font-semibold text-[#212529] sm:text-xl">{selected.title || "Visual story"}</h3>
                {selected.description && <p className="mt-1 text-sm leading-6 text-[#5F6670]">{selected.description}</p>}
                <p className="mt-1 text-xs text-slate-500">{selectedIndex + 1} of {photos.length}</p>
              </div>
              <button type="button" onClick={() => setSelectedIndex(null)} aria-label="Close gallery viewer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D9E0E8] text-xl text-[#354252] hover:bg-slate-50">×</button>
            </div>
            <div className="relative flex min-h-[240px] max-h-[72vh] items-center justify-center bg-black">
              <img src={resolveImageUrl(selected.mediaUrl)} alt={selected.title || "ROOMO gallery photo"} onError={(event) => { event.currentTarget.style.display = "none"; }} className="max-h-[72vh] w-full object-contain" />
              {photos.length > 1 && (
                <>
                  <button type="button" onClick={showPrevious} aria-label="Previous photo" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/55 text-white shadow-lg transition hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <button type="button" onClick={showNext} aria-label="Next photo" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/55 text-white shadow-lg transition hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
