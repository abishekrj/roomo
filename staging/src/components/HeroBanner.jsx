import { useEffect, useState } from "react";
import templeHeroImage from "../../../roomo-frontend/assets/roomo-hero-banner.jpg";

const API_URL = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/homepage";
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
      badge: content?.heroBadge || "SACRED STAYS · DIVINE JOURNEYS",
      titleLine: content?.heroTitleLine || "Seek Blessed Stays",
      titleAccent: content?.heroTitleAccent || "in Tiruvannamalai",
      description: content?.heroDescription || "Comfortable stays, trusted transport and local experiences for your spiritual journey.",
      image: content?.heroImageUrl || templeHeroImage,
      imageAlt: "Arunachala hill and the sacred temple in Tiruvannamalai",
      buttonLabel: "Browse Rooms",
      buttonHref: "/staging/properties",
      secondaryButtonLabel: "Bring Your Property",
      secondaryButtonHref: "/staging/owner/signup",
    },
    {
      badge: content?.heroSecondBadge || "ROOMO TRAVEL · OUTSTATION CAB BOOKING",
      titleLine: content?.heroSecondTitleLine || "Your Journey Beyond",
      titleAccent: content?.heroSecondTitleAccent || "Tiruvannamalai",
      description: content?.heroSecondDescription || "Arrange a comfortable outstation journey with ROOMO. Plan your pickup, destination and travel time in a few simple steps.",
      image: content?.heroSecondImageUrl || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=85",
      imageAlt: "Comfortable car ready for an outstation journey",
      buttonLabel: "Book a Cab",
      buttonHref: "/staging/transport-booking",
      secondaryButtonLabel: "Offer a Ride",
      secondaryButtonHref: "/staging/driver",
    },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide(current => (current + 1) % slides.length), SLIDE_INTERVAL);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section aria-label="ROOMO stays and travel" className="relative isolate overflow-hidden bg-slate-900">
      {slides.map((slide, index) => (
        <div key={slide.buttonLabel} aria-hidden={activeSlide !== index} className={`absolute inset-0 transition-opacity duration-700 ${activeSlide === index ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <img src={slide.image} alt="" className="h-full w-full object-cover" fetchPriority={index === 0 ? "high" : "auto"} decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-slate-950/10" />
          <div className="absolute inset-0 bg-slate-950/10" />
        </div>
      ))}
      <div className="relative mx-auto flex min-h-[430px] w-full max-w-7xl items-center px-5 pb-16 pt-12 sm:min-h-[470px] sm:px-8 sm:pb-20 lg:min-h-[520px] lg:px-10">
        {slides.map((slide, index) => (
          <div key={slide.buttonLabel} aria-hidden={activeSlide !== index} className={`w-full max-w-3xl transition-all duration-500 ${activeSlide === index ? "translate-y-0 opacity-100" : "pointer-events-none absolute translate-y-2 opacity-0"}`}>
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/30 bg-slate-950/25 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[.14em] text-white backdrop-blur-sm sm:text-xs">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5 14.4 9.6 21.5 12l-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4L12 2.5Z" /></svg>
              <span>{slide.badge}</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
              {slide.titleLine}
              <span className="mt-1 block">{slide.titleAccent}</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/90 sm:text-base sm:leading-7">{slide.description}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href={slide.buttonHref} tabIndex={activeSlide === index ? 0 : -1} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#2563a6] bg-[#2563a6] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#1e4f85] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#2563a6] sm:text-base">
                {slide.buttonLabel}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
              </a>
              <a href={slide.secondaryButtonHref} tabIndex={activeSlide === index ? 0 : -1} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white hover:text-[#2563a6] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 sm:text-base">
                {slide.secondaryButtonLabel}
              </a>
            </div>
          </div>
        ))}
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between sm:bottom-7 sm:left-8 sm:right-8 lg:left-10 lg:right-10">
          <div className="flex items-center gap-2" aria-label="Hero slides">
            {slides.map((slide, index) => (
              <button key={slide.buttonLabel} type="button" aria-label={`Show slide ${index + 1}: ${slide.buttonLabel}`} aria-pressed={activeSlide === index} onClick={() => setActiveSlide(index)} className={`h-2.5 rounded-full transition-all duration-300 ${activeSlide === index ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Previous hero slide" onClick={() => setActiveSlide(current => (current + slides.length - 1) % slides.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-slate-950/20 text-white backdrop-blur-sm transition hover:bg-white/20"><span aria-hidden="true">←</span></button>
            <button type="button" aria-label="Next hero slide" onClick={() => setActiveSlide(current => (current + 1) % slides.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-slate-950/20 text-white backdrop-blur-sm transition hover:bg-white/20"><span aria-hidden="true">→</span></button>
          </div>
        </div>
      </div>
    </section>
  );
}
