import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:5001/api/homepage";

function StarRating({ value }) {
  if (value == null || value === "") return null;
  return <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700"><span className="text-amber-500" aria-hidden="true">★</span>{value}</span>;
}

export default function FeaturedStays() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL, { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (cancelled) return;
        setContent(data?.content || null);
      })
      .catch(() => { if (!cancelled) setContent(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const stays = Array.isArray(content?.featuredProperties) && content.featuredProperties.length
    ? content.featuredProperties.map((property, index) => ({
        id: property.id,
        name: property.title,
        type: property.propertyType,
        location: [property.address, property.city, property.state].filter(Boolean).join(", "),
        price: property.nightlyPrice,
        img: property.images?.[0]?.imageUrl || "",
        desc: property.description,
        url: property.url || property.href || "/roomo-stay-details.html?id=" + encodeURIComponent(property.id),
        sortOrder: property.featuredSortOrder ?? index
      }))
    : Array.isArray(content?.featuredRooms)
      ? content.featuredRooms.filter(stay => stay && stay.featured !== false)
          .sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999))
      : [];
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
    <section aria-labelledby="featured-stays-title" className="w-full bg-white px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 md:flex-row md:items-end">
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
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
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
              <article key={stay.id || stay.name || index} data-featured-stay-card className="group flex w-[min(280px,84vw)] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow duration-200 hover:shadow-lg sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3.75rem)/4)]">
                <a href={stay.url || stay.href || "/roomo-search-results.html"} className="flex h-full flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {stay.img && <img src={stay.img} alt={stay.name || ""} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />}
                    {stay.type && <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-md bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">{stay.type}</span>}
                  </div>
                  <div className="flex min-h-[190px] flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-base font-semibold leading-6 text-[#212529]">{stay.name || ""}</h3>
                      <StarRating value={stay.rating} />
                    </div>
                    {stay.location && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{stay.location}</p>}
                    {stay.desc && <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">{stay.desc}</p>}
                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      {stay.reviews != null && <span className="text-xs text-slate-500">{stay.reviews} {content?.featuredReviewLabel || ""}</span>}
                      {stay.price != null && <span className="ml-auto whitespace-nowrap text-right text-sm text-slate-600">{content?.featuredPricePrefix || ""}<strong className="text-base font-semibold text-[#212529]">₹{Number(stay.price).toLocaleString("en-IN")}</strong><span className="block text-xs text-slate-500">{content?.featuredPriceSuffix || "per night"}</span></span>}
                    </div>
                  </div>
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
