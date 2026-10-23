import { useEffect, useState } from "react";
import mobileHeroImage from "../../../roomo-frontend/assets/roomo-hero-banner.jpg";
import desktopHeroImage from "../../../roomo-frontend/assets/hero-desktop.png";

const girivalamHighlights = [
  "Plan your Pournami Girivalam with a peaceful stay",
  "Stay close to Arunachala Hill and the sacred Girivalam path",
  "Find a restful stay near Annamalaiyar Temple",
  "Discover ashrams, heritage homes and serene retreats",
  "Make room for a calmer, more meaningful pilgrimage",
];

export default function HeroBanner() {
  const [activeHighlight, setActiveHighlight] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveHighlight((current) => (current + 1) % girivalamHighlights.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section aria-labelledby="home-hero-title" className="overflow-hidden border-b border-slate-200 bg-[#f7f5f0]">
      <div className="block w-full leading-none md:hidden">
        <img
          src={mobileHeroImage}
          alt="ROOMO Sacred — Tiruvannamalai"
          className="block h-auto w-full object-contain"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 pb-8 pt-9 sm:px-7 sm:pb-12 sm:pt-14 md:grid-cols-[1.08fr_.92fr] lg:gap-12 lg:px-8 lg:pb-14 lg:pt-12">
        <div className="relative z-10">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#e5d8b8] bg-white/80 px-3.5 py-2 text-xs font-semibold leading-5 text-[#51452f] shadow-sm sm:text-sm">
            <svg className="h-4 w-4 shrink-0 text-[#b38a38]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.5 14.4 9.6 21.5 12l-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4L12 2.5Z" />
            </svg>
            <span>Abode of Silence &amp; Divine Fire (Agni Sthalam)</span>
          </div>

          <h1 id="home-hero-title" className="max-w-2xl text-4xl font-normal leading-[1.12] tracking-tight text-[#212529] sm:text-5xl lg:text-[3.5rem]">
            Find Sacred Solace at
            <span className="mt-1 block font-semibold text-[#183b56]">Holy Arunachala</span>
            <span className="sr-only"> stays and accommodation in Tiruvannamalai</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Hand-curated sanctuary stays, peaceful ashram guest rooms, and heritage havelis situated in revered proximity to Annamalaiyar Temple &amp; Sri Ramanasramam.
          </p>

          <div
            className="mt-6 flex min-h-[76px] max-w-xl items-center gap-3 rounded-lg border border-[#e5d8b8] bg-white px-4 py-3 shadow-sm"
            aria-label="Pournami Girivalam highlights"
            aria-live="polite"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7f0df] text-[#9b762f]" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 2a9.8 9.8 0 0 0 9.1 13.4A10 10 0 1 1 8.6 2.3 9.7 9.7 0 0 0 12 2Z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9b762f]">Pournami Girivalam</p>
              <p key={activeHighlight} className="mt-1 animate-[fadeIn_.35s_ease-out] text-sm font-medium leading-5 text-[#333333] sm:text-base">
                {girivalamHighlights[activeHighlight]}
              </p>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-slate-500">
              {String(activeHighlight + 1).padStart(2, "0")} / {String(girivalamHighlights.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="relative mx-auto hidden w-full max-w-xl md:block lg:max-w-none">
          <div className="relative h-[260px] w-full overflow-hidden rounded-t-[200px] rounded-b-[28px] border-[6px] border-white bg-[#e8e1d5] shadow-xl min-[992px]:h-[380px]">
            <img
              src={desktopHeroImage}
              alt="Arunachala Hill in Tiruvannamalai, Tamil Nadu"
              className="block h-full w-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
