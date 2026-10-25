import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5001/api/gallery";

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!selected) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const visibleItems = useMemo(
    () => items.filter((item) => filter === "ALL" || item.type === filter),
    [items, filter]
  );

  const videoUrl = (item) => {
    if (item.sourceType === "YOUTUBE") {
      try {
        const url = new URL(item.mediaUrl);
        url.searchParams.set("autoplay", "1");
        url.searchParams.set("rel", "0");
        return url.toString();
      } catch {
        return item.mediaUrl;
      }
    }
    return item.mediaUrl;
  };

  return (
    <section aria-labelledby="roomo-gallery-title" className="w-full bg-[#F7F9FC] px-4 py-12 sm:px-6 sm:py-16 md:py-10 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-5 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#2563A6] sm:text-sm">Visual stories</p>
            <h2 id="roomo-gallery-title" className="text-2xl font-semibold leading-tight tracking-tight text-[#212529] sm:text-3xl lg:text-4xl">Gallery</h2>
            <p className="mt-3 text-sm leading-6 text-[#5F6670] sm:text-base sm:leading-7">Explore sacred places, memorable moments and video stories from Tiruvannamalai.</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter gallery">
            {[{ value: "ALL", label: "All media" }, { value: "IMAGE", label: "Photos" }, { value: "VIDEO", label: "Videos" }].map((option) => (
              <button key={option.value} type="button" onClick={() => setFilter(option.value)} aria-pressed={filter === option.value}
                className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A6] focus-visible:ring-offset-2 ${filter === option.value ? "border-[#2563A6] bg-[#2563A6] text-white" : "border-[#D9E0E8] bg-white text-[#354252] hover:border-[#2563A6] hover:text-[#2563A6]"}`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading gallery">
            {[1, 2, 3, 4, 5, 6].map((number) => <div key={number} className="aspect-[4/3] animate-pulse rounded-lg bg-slate-200" />)}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#D9E0E8] bg-white px-6 py-12 text-center text-sm text-[#5F6670]">
            {items.length === 0 ? "Gallery media will appear here soon." : "No media in this category yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {visibleItems.map((item, index) => (
              <button key={item.id || item.title || index} type="button" onClick={() => setSelected(item)}
                className="group overflow-hidden rounded-lg border border-[#E3E8EF] bg-white text-left shadow-sm transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A6] focus-visible:ring-offset-2"
                aria-label={`Open ${item.type === "VIDEO" ? "video" : "photo"}: ${item.title || "Gallery item"}`}>
                <div className="relative aspect-[4/3] overflow-hidden bg-[#EAF0F7]">
                  {item.type === "VIDEO" && item.sourceType === "YOUTUBE" ? (
                    <img src={item.thumbnailUrl || item.mediaUrl.replace(/\/embed\/([^?&/]+)/, "/vi/$1/hqdefault.jpg")} alt={item.title || ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  ) : item.type === "VIDEO" && item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.title || ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  ) : item.type === "VIDEO" ? (
                    <video src={item.mediaUrl} preload="metadata" muted playsInline className="h-full w-full object-cover" aria-label={item.title || "Gallery video preview"} />
                  ) : (
                    <img src={item.mediaUrl} alt={item.title || ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  )}
                  {item.type === "VIDEO" && <span className="absolute inset-0 flex items-center justify-center bg-black/15"><span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-black/50 text-2xl text-white shadow-lg" aria-hidden="true">▶</span><span className="sr-only">Play video</span></span>}
                  <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#2563A6]">{item.type === "VIDEO" ? "Video" : "Photo"}</span>
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="text-base font-semibold text-[#212529]">{item.title}</h3>
                  {item.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5F6670]">{item.description}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#101820]/85 p-3 sm:p-6" role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="roomo-gallery-dialog-title" className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
              <div>
                <h3 id="roomo-gallery-dialog-title" className="text-lg font-semibold text-[#212529] sm:text-xl">{selected.title}</h3>
                {selected.description && <p className="mt-1 text-sm leading-6 text-[#5F6670]">{selected.description}</p>}
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close gallery viewer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D9E0E8] text-xl text-[#354252] hover:bg-slate-50">×</button>
            </div>
            <div className="flex max-h-[72vh] items-center justify-center bg-black">
              {selected.type === "VIDEO" && selected.sourceType === "YOUTUBE" ? (
                <iframe src={videoUrl(selected)} title={selected.title || "ROOMO gallery video"} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              ) : selected.type === "VIDEO" ? (
                <video src={selected.mediaUrl} controls autoPlay playsInline className="max-h-[72vh] w-full" />
              ) : (
                <img src={selected.mediaUrl} alt={selected.title || ""} className="max-h-[72vh] w-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
