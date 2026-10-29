import { useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/homepage";
const fallback = {
  enabled: true,
  eyebrow: "PARTNER WITH ROOMO",
  title: "Your property. More meaningful stays.",
  description: "Welcome pilgrims and travellers to your property with ROOMO. Reach guests planning their sacred visit to Tiruvannamalai and manage enquiries through your owner dashboard.",
  buttonLabel: "List your property",
  helperText: "Join ROOMO and share your stay with more guests."
};

export default function PropertyOwnerPromoBanner() {
  const [section, setSection] = useState(fallback);
  useEffect(() => {
    let cancelled = false;
    fetch(API_URL, { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!cancelled) setSection({ ...fallback, ...(data?.content?.propertyOwnerPromo || {}) }); })
      .catch(() => { if (!cancelled) setSection(fallback); });
    return () => { cancelled = true; };
  }, []);
  if (section.enabled === false) return null;
  return (
    <section aria-labelledby="property-owner-promo-title" className="w-full bg-[#f4f7fb] pt-0 pb-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="relative isolate grid items-center gap-6 overflow-hidden rounded-lg bg-[#2563a6] px-5 py-7 text-white sm:px-8 sm:py-9 md:grid-cols-[1.2fr_.8fr] md:gap-10 lg:px-12 lg:py-11">

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <svg viewBox="0 0 180 180" className="absolute -right-5 -top-8 h-40 w-40 text-white opacity-25 animate-pulse sm:h-52 sm:w-52" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 82 90 24l72 58M34 75v76h112V75M67 151v-44h46v44M52 91h15m46 0h15M52 108h7m62 0h7"/>
            <rect x="48" y="82" width="84" height="69" rx="3"/><path d="M75 82V63h30v19M85 63V49h10v14"/>
          </svg>
          <svg viewBox="0 0 160 160" className="absolute -bottom-10 left-[38%] h-32 w-32 text-white opacity-20 animate-[spin_32s_linear_infinite] sm:h-40 sm:w-40" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="80" cy="80" r="58" strokeDasharray="5 7"/><path d="M42 105V64l38-21 38 21v41M53 105V73h54v32M70 105V84h20v21M34 118h92"/>
            <path d="M58 57V44h44v13"/>
          </svg>
        </div>
          <div className="relative z-10 min-w-0">
            {section.eyebrow && <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.16em] text-blue-100">{section.eyebrow}</span>}
            <h2 id="property-owner-promo-title" className="mt-4 max-w-2xl text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">{section.title}</h2>
            {section.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base sm:leading-7">{section.description}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="/post-property" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white bg-white px-5 py-3 text-sm font-semibold text-[#2563a6] transition-colors hover:bg-blue-50">{section.buttonLabel || "List your property"} <span aria-hidden="true">→</span></a>
              {section.helperText && <span className="text-xs text-blue-100/85">{section.helperText}</span>}
            </div>
          </div>
          <div className="relative z-10 flex min-h-44 flex-col justify-center gap-3 rounded-lg border border-white/15 bg-white/10 p-5 sm:p-6">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-[#2563a6]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 21v-4h4v4"/></svg></span><div><p className="text-sm font-semibold text-white">Showcase your property</p><p className="mt-1 text-xs leading-5 text-blue-100">Present your rooms and amenities to guests planning a visit.</p></div></div>
            <div className="h-px bg-white/15" />
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-[#2563a6]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 5.5v15M8 7h8M8 11h6"/></svg></span><div><p className="text-sm font-semibold text-white">Manage enquiries</p><p className="mt-1 text-xs leading-5 text-blue-100">Keep guest requests organised through your owner dashboard.</p></div></div>
            <div className="h-px bg-white/15" />
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-[#2563a6]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/></svg></span><div><p className="text-sm font-semibold text-white">Welcome more pilgrims</p><p className="mt-1 text-xs leading-5 text-blue-100">Help travellers find a stay close to their sacred journey.</p></div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
