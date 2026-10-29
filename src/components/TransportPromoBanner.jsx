import { useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/homepage";

export default function TransportPromoBanner() {
  const [section, setSection] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch(API_URL, { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!cancelled) setSection(data?.content?.transportPromo || null); })
      .catch(() => { if (!cancelled) setSection(null); });
    return () => { cancelled = true; };
  }, []);
  if (!section || section.enabled === false) return null;

  return (
    <section aria-labelledby="roomo-transport-promo-title" className="w-full bg-[#f4f7fb] py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="relative isolate grid items-center gap-6 overflow-hidden rounded-lg bg-[#2563a6] px-5 py-7 text-white sm:px-8 sm:py-9 md:grid-cols-[1.2fr_.8fr] md:gap-10 lg:px-12 lg:py-11">

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <svg viewBox="0 0 180 180" className="absolute -right-4 -top-8 h-40 w-40 text-white opacity-25 animate-pulse sm:h-52 sm:w-52" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 110h144l-12-39a12 12 0 0 0-11-8H48a12 12 0 0 0-11 8l-19 39ZM27 110v24h126v-24M43 134v12m94-12v12"/>
            <circle cx="49" cy="111" r="10"/><circle cx="131" cy="111" r="10"/><path d="M45 80h90M61 64l-7 29m65-29 7 29"/>
          </svg>
          <svg viewBox="0 0 160 160" className="absolute -bottom-9 left-[38%] h-32 w-32 text-white opacity-20 animate-[spin_32s_linear_infinite] sm:h-40 sm:w-40" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M80 143s45-30 45-76a45 45 0 1 0-90 0c0 46 45 76 45 76Z"/><circle cx="80" cy="66" r="16"/><path d="M80 50v16l11 7"/>
            <path d="M22 126c16-9 26-9 42 0s26 9 42 0 26-9 32-7" strokeDasharray="4 5"/>
          </svg>
        </div>
          <div className="relative z-10 min-w-0">
            {section.eyebrow && <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.16em] text-blue-100">{section.eyebrow}</span>}
            <h2 id="roomo-transport-promo-title" className="mt-4 max-w-2xl text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">{section.title || "Your sacred journey, from door to destination."}</h2>
            {section.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base sm:leading-7">{section.description}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="/transport-booking" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white bg-white px-5 py-3 text-sm font-semibold text-[#2563a6] transition-colors hover:bg-blue-50">{section.buttonLabel || "Plan your journey"} <span aria-hidden="true">→</span></a>
              {section.helperText && <span className="text-xs text-blue-100/85">{section.helperText}</span>}
            </div>
          </div>
          <div className="relative z-10 flex min-h-44 flex-col justify-center gap-3 rounded-lg border border-white/15 bg-white/10 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-[#2563a6]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 15v-3l2-6h14l2 6v3M5 15h14M7 15v3m10-3v3M5 12h14"/><circle cx="7" cy="12" r="1"/><circle cx="17" cy="12" r="1"/></svg></span>
              <div><p className="text-sm font-semibold text-white">Comfortable local rides</p><p className="mt-1 text-xs leading-5 text-blue-100">Choose a car or van for temple visits and local travel.</p></div>
            </div>
            <div className="h-px bg-white/15" />
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-[#2563a6]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
              <div><p className="text-sm font-semibold text-white">Convenient pickups</p><p className="mt-1 text-xs leading-5 text-blue-100">Request station pickups and trips around Tiruvannamalai.</p></div>
            </div>
            <div className="h-px bg-white/15" />
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-[#2563a6]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>
              <div><p className="text-sm font-semibold text-white">Plan your journey in one place</p><p className="mt-1 text-xs leading-5 text-blue-100">Send a ride request for Girivalam, temple visits and day trips.</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
