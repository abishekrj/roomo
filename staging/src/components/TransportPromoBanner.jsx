import { useState } from "react";

export default function TransportPromoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <section aria-labelledby="roomo-transport-promo-title" className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="relative mx-auto grid w-full max-w-7xl overflow-hidden rounded-lg bg-[#102747] text-white shadow-sm md:grid-cols-[1.15fr_.85fr]">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[28px] border-white/5" aria-hidden="true" />
        <div className="relative z-10 px-6 py-8 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.16em] text-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> New · ROOMO Travel
          </span>
          <h2 id="roomo-transport-promo-title" className="mt-4 max-w-xl text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">Your sacred journey, from door to destination.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base sm:leading-7">Book a car or van for temple visits, Girivalam, station pickups and day trips around Tiruvannamalai. Local travel, made simpler.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="/staging/transport-booking" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2563a6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1e4f85] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#102747]">Book a car or van <span aria-hidden="true">→</span></a>
            <span className="text-xs text-blue-100/80">Driver confirmation follows your request.</span>
          </div>
        </div>
        <div className="relative flex min-h-48 items-center justify-center overflow-hidden bg-[#1d4774] px-6 py-8 md:min-h-full">
          <div className="absolute inset-x-0 bottom-8 h-px bg-white/10" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/[0.03]" />
          <svg viewBox="0 0 440 220" role="img" aria-label="Illustration of a comfortable passenger van on the road" className="relative z-10 w-full max-w-md drop-shadow-2xl">
            <path d="M22 183 C105 169 138 194 220 181 S345 167 418 183" fill="none" stroke="#9cc7f1" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round"/>
            <path d="M72 144 L91 95 Q96 81 115 81 H273 Q292 81 306 101 L337 144 Z" fill="#f8fbff"/>
            <path d="M110 91 H171 V126 H96 Z" fill="#9fc8ed"/>
            <path d="M181 91 H267 Q282 91 293 108 L307 126 H181 Z" fill="#9fc8ed"/>
            <path d="M68 140 H343 Q354 140 354 152 V166 H61 V151 Q61 140 68 140Z" fill="#dce9f7"/>
            <path d="M73 146 H341 V163 H73 Z" fill="#2563a6"/>
            <rect x="202" y="145" width="3" height="17" rx="1.5" fill="#dce9f7"/>
            <rect x="242" y="145" width="3" height="17" rx="1.5" fill="#dce9f7"/>
            <circle cx="112" cy="166" r="22" fill="#0c1e33"/><circle cx="112" cy="166" r="10" fill="#b7cde2"/><circle cx="112" cy="166" r="4" fill="#54728f"/>
            <circle cx="303" cy="166" r="22" fill="#0c1e33"/><circle cx="303" cy="166" r="10" fill="#b7cde2"/><circle cx="303" cy="166" r="4" fill="#54728f"/>
            <rect x="331" y="145" width="14" height="7" rx="3.5" fill="#ffcf87"/><rect x="64" y="146" width="10" height="7" rx="3.5" fill="#ffcf87"/>
            <path d="M350 95 Q366 83 379 95" fill="none" stroke="#8cb6e2" strokeWidth="3" strokeLinecap="round"/><path d="M360 80 Q380 63 398 80" fill="none" stroke="#8cb6e2" strokeWidth="3" strokeLinecap="round" opacity=".65"/>
            <circle cx="371" cy="112" r="4" fill="#8cb6e2"/>
          </svg>
          <div className="absolute right-5 top-5 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm sm:right-8 sm:top-8">Comfortable rides <span className="ml-1 text-emerald-300">✓</span></div>
        </div>
        <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss transport promotion" className="absolute right-3 top-3 z-20 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white">×</button>
      </div>
    </section>
  );
}
