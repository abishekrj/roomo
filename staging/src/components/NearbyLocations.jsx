import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:5001/api/homepage/nearby-places";

export default function NearbyLocations() {
  const [section, setSection] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const trackRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load nearby locations.");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setSection(data || null);
      })
      .catch(() => {
        if (!cancelled) setSection(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedPlace) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelectedPlace(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedPlace]);

  const places = Array.isArray(section?.places)
    ? [...section.places].filter((place) => place && place.visible !== false)
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    : [];

  const scroll = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("[data-nearby-card]");
    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const distance = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.85;
    track.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  if (!section || section.enabled === false || places.length === 0) return null;

  return (
    <section aria-labelledby="nearby-locations-title" className="w-full bg-white px-4 py-12 sm:px-6 sm:py-16 md:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            {section.eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#2563A6] sm:text-sm">{section.eyebrow}</p>}
            {section.title && <h2 id="nearby-locations-title" className="text-2xl font-semibold leading-tight tracking-tight text-[#212529] sm:text-3xl lg:text-4xl">{section.title}</h2>}
            {section.description && <p className="mt-4 max-w-2xl text-sm leading-6 text-[#5F6670] sm:text-base sm:leading-7">{section.description}</p>}
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
            <div className="flex items-center gap-2">
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-2xl leading-none text-slate-700 transition hover:border-[#2563A6] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => scroll(-1)} aria-label="Previous nearby locations" disabled={places.length < 2}>‹</button>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-2xl leading-none text-slate-700 transition hover:border-[#2563A6] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => scroll(1)} aria-label="Next nearby locations" disabled={places.length < 2}>›</button>
            </div>
          </div>
        </div>

        <div ref={trackRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5" aria-label="Nearby locations">
          {places.map((place, index) => (
            <button
              key={place.id || place.name || index}
              type="button"
              onClick={() => setSelectedPlace(place)}
              data-nearby-card="" className="flex w-[84%] min-w-0 shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-0 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A6] focus-visible:ring-offset-2 sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3.75rem)/4)]"
              aria-label={place.name ? `View details for ${place.name}` : "View nearby location details"}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                {place.imageUrl ? (
                  <img src={place.imageUrl} alt={place.name || ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-4xl text-slate-400" aria-hidden="true">⌖</div>
                )}
                {place.location && <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#212529]">{place.location}</span>}
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                {place.name && <h3>{place.name}</h3>}
                {place.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#5F6670]">{place.description}</p>}
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#2563A6]">Explore location <span aria-hidden="true">↗</span></span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedPlace && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101820]/65 p-4"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPlace(null); }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="nearby-place-dialog-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
            {selectedPlace.imageUrl && <img src={selectedPlace.imageUrl} alt={selectedPlace.name || ""} className="max-h-72 w-full object-cover" />}
            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 id="nearby-place-dialog-title" className="text-xl font-semibold text-[#212529] sm:text-2xl">{selectedPlace.name}</h3>
                </div>
                <button type="button" onClick={() => setSelectedPlace(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E4E8ED] text-xl text-[#526170] hover:bg-[#F7F8FA]" aria-label="Close location details">×</button>
              </div>
              {selectedPlace.location && <p className="mt-3 text-sm font-medium text-[#2563A6]">{selectedPlace.location}</p>}
              {selectedPlace.description && <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5F6670]">{selectedPlace.description}</p>}
              {selectedPlace.mapUrl && <a href={selectedPlace.mapUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-lg bg-[#2563A6] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1D4F85]">Open map ↗</a>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
