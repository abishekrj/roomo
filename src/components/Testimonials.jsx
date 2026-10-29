import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:5001/api/homepage";

const defaults = {
  eyebrow: "Heartfelt Devotee Words",
  title: "Words from Fellow Pilgrims",
  description: "Authentic experiences shared by devotees who sought blessed shelter through ROOMO.",
  items: [
    { id: "senthil", quote: "Our Pournami Girivalam stay was profoundly peaceful. The room was immaculate, 3 minutes from Sri Ramanasramam, and our host welcomed us with sacred vibhuti and temple prasadam.", name: "Senthil Ramanathan", location: "Chennai, Tamil Nadu", rating: 5 },
    { id: "ananya", quote: "During Karthigai Deepam festival when everywhere else was charging inflated prices, ROOMO honored our confirmed heritage booking without surprise costs. Utterly safe for solo women travelers.", name: "Ananya Sharma", location: "Bengaluru, Karnataka", rating: 5 },
    { id: "michael", quote: "The open terrace had an unobstructed view of Holy Mount Arunachala for morning dhyanam. The support care team coordinated our temple darshan passes smoothly.", name: "Michael Harrison", location: "San Francisco, USA", rating: 5 },
    { id: "venkatesh", quote: "The sattvic breakfast and quiet courtyard ambiance made our family pilgrimage so memorable. Booking was effortless and check-in at midnight was greeted warmly.", name: "Venkatesh Krishnan", location: "Hyderabad, Telangana", rating: 5 }
  ]
};

function initials(name = "ROOMO Guest") {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

export default function Testimonials() {
  const [content, setContent] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(API_URL, { cache: "no-store", signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        const config = data?.content?.testimonials;
        if (config && typeof config === "object") {
          setContent({
            ...defaults,
            ...config,
            items: Array.isArray(config.items) ? config.items.filter(item => item && !item.hidden) : defaults.items
          });
        }
      })
      .catch(error => {
        if (error.name !== "AbortError") console.warn("ROOMO testimonials API unavailable; using default content.", error);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const scroll = direction => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector("[data-testimonial-card]");
    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const distance = slide ? slide.getBoundingClientRect().width + gap : track.clientWidth * 0.85;
    track.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  const items = (Array.isArray(content.items) ? content.items : defaults.items).filter(item => item && !item.hidden);

  return (
    <section id="testimonials" aria-labelledby="testimonials-title" className="w-full bg-[#f8fafc] py-12 sm:py-16 md:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-7 flex items-end justify-between gap-3 md:mb-9 md:gap-5">
          <div className="max-w-3xl">
            <span className="mb-3 inline-flex items-center rounded-full border border-[#d8e4ed] bg-white px-3 py-1.5 text-xs font-medium text-[#285b7d]">
              <span className="mr-2" aria-hidden="true">♡</span>{content.eyebrow || defaults.eyebrow}
            </span>
            <h2 id="testimonials-title" className="text-2xl font-semibold tracking-tight text-[#212529] sm:text-3xl lg:text-4xl">
              {content.title || defaults.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {content.description || defaults.description}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => scroll(-1)} aria-label="Previous testimonial" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#285b7d]">
                <span aria-hidden="true">←</span>
              </button>
              <button type="button" onClick={() => scroll(1)} aria-label="Next testimonial" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#285b7d]">
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading testimonials">
            {[0, 1, 2].map(item => <div key={item} className="h-64 animate-pulse rounded-lg border border-slate-200 bg-white" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-8 text-sm text-slate-600">Guest testimonials will appear here soon.</div>
        ) : (
          <div ref={trackRef} className="roomo-testimonials-track flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3" aria-live="polite">
            {items.map((item, index) => (
              <article key={item.id || item.name || index} data-testimonial-card className="flex w-[min(330px,84vw)] shrink-0 snap-start sm:w-[min(360px,calc(50vw-2rem))] lg:w-[calc((100%-2rem)/3)]">
                <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-[0_3px_14px_rgba(24,59,86,0.045)] sm:p-6">
                  <div className="mb-3 text-base tracking-wide text-amber-500" aria-label={`${Math.max(0, Math.min(5, Number(item.rating) || 5))} out of 5 stars`}>
                    {"★".repeat(Math.max(0, Math.min(5, Number(item.rating) || 5)))}
                  </div>
                  <blockquote className="flex-1 text-sm leading-7 text-slate-600">“{item.quote || ""}”</blockquote>
                  <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-semibold text-white" aria-hidden="true">{initials(item.name)}</div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[#212529]">{item.name || "ROOMO Guest"}</h3>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{item.location || "ROOMO Guest"}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
