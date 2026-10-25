import { useEffect, useState } from "react";
import desktopHeroImage from "../../../roomo-frontend/assets/roomo-hero-banner.jpg";

const API_URL = "http://localhost:5001/api/homepage";
const SLIDE_INTERVAL = 6500;

export default function HeroBanner() {
  const [content, setContent] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL, { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!cancelled) setContent(data?.content || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const slides = [
    {
      badge: content?.heroBadge || "Abode of Silence & Divine Fire (Agni Sthalam)",
      titleLine: content?.heroTitleLine || "Find Sacred Solace at",
      titleAccent: content?.heroTitleAccent || "Holy Arunachala",
      description: content?.heroDescription || "Hand-curated sanctuary stays, peaceful ashram guest rooms, and heritage havelis situated in revered proximity to Annamalaiyar Temple & Sri Ramanasramam.",
      image: content?.heroImageUrl || desktopHeroImage,
      imageAlt: "ROOMO Sacred stays hero banner",
      buttonLabel: "Browse Rooms",
      buttonHref: "/staging/properties",
    },
    {
      badge: content?.heroSecondBadge || "ROOMO Cab Booking",
      titleLine: content?.heroSecondTitleLine || "Your Journey Beyond",
      titleAccent: content?.heroSecondTitleAccent || "Tiruvannamalai",
      description: content?.heroSecondDescription || "Book a cab for outdoor destinations or arrange a comfortable return journey to your hometown. Plan your onward travel with ROOMO.",
      image: content?.heroSecondImageUrl || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "ROOMO cab booking for onward journeys",
      buttonLabel: "Book a Cab",
      buttonHref: "/staging/transport-booking",
    },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide(current => (current + 1) % 2), SLIDE_INTERVAL);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section aria-label="ROOMO featured services" className="hidden overflow-hidden border-b border-slate-200 bg-[#f7f5f0] md:block">
      <div className="relative mx-auto min-h-[430px] w-full max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:min-h-[500px] lg:py-14">
        {slides.map((slide, index) => (
          <div
            key={index}
            aria-hidden={activeSlide !== index}
            className={`grid items-center gap-8 transition-opacity duration-700 ease-in-out md:grid-cols-[1.08fr_.92fr] lg:gap-12 ${activeSlide === index ? "relative opacity-100" : "pointer-events-none absolute inset-x-4 top-9 opacity-0 sm:inset-x-6 sm:top-12 lg:top-14"}`}
          >
            <div className="relative z-10">
              <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#2563a6]/25 bg-white/80 px-3.5 py-2 text-xs font-semibold leading-5 text-[#2563a6] shadow-sm sm:text-sm">
                <svg className="h-4 w-4 shrink-0 text-[#2563a6]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5 14.4 9.6 21.5 12l-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4L12 2.5Z" /></svg>
                <span>{slide.badge}</span>
              </div>
              <h2 className="max-w-2xl text-[2.5rem] font-normal leading-[1.12] tracking-tight text-[#212529]">
                {slide.titleLine}
                <span className="mt-1 block font-semibold text-[#2563a6]">{slide.titleAccent}</span>
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{slide.description}</p>
              <a href={slide.buttonHref} tabIndex={activeSlide === index ? 0 : -1} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#2563a6] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1e4f85] focus:outline-none focus:ring-2 focus:ring-[#2563a6] focus:ring-offset-2 sm:text-base">
                {slide.buttonLabel}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
              </a>
            </div>
            <div className="relative mx-auto hidden w-full max-w-xl md:block lg:max-w-none">
              <div className="relative h-[260px] w-full overflow-hidden rounded-t-[200px] rounded-b-[28px] border-[6px] border-white bg-[#e8e1d5] shadow-xl min-[992px]:h-[380px]">
                <img src={slide.image} alt={slide.imageAlt} className="block h-full w-full object-cover" fetchPriority={index === 0 ? "high" : "auto"} decoding="async" />
              </div>
            </div>
          </div>
        ))}
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-4" aria-label="Hero slides">
          {slides.map((slide, index) => (
            <button key={slide.buttonLabel} type="button" aria-label={`Show slide ${index + 1}: ${slide.buttonLabel}`} aria-pressed={activeSlide === index} onClick={() => setActiveSlide(index)} className={`h-2.5 rounded-full transition-all duration-300 ${activeSlide === index ? "w-7 bg-[#2563a6]" : "w-2.5 bg-slate-300 hover:bg-slate-400"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
