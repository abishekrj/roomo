import heroImage from "../../../roomo-frontend/assets/roomo-hero-banner.jpg";

const highlights = [
  "Pournami Girivalam — plan your sacred stay",
  "Peaceful stays near Arunachala",
  "Stay close to Annamalaiyar Temple",
  "Discover ashrams and heritage retreats",
  "A serene home for your pilgrimage",
];

export default function HeroBanner() {
  return (
    <section aria-labelledby="home-hero-title" className="overflow-hidden bg-[#f7f5f0]">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 pb-8 pt-9 sm:px-7 sm:pb-12 sm:pt-14 lg:grid-cols-[1.08fr_.92fr] lg:gap-12 lg:px-8 lg:pb-14 lg:pt-12">
        <div className="relative z-10">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#e5d8b8] bg-white/80 px-3.5 py-2 text-xs font-semibold leading-5 text-[#51452f] shadow-sm sm:text-sm">
            <svg className="h-4 w-4 shrink-0 text-[#b38a38]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5 14.4 9.6 21.5 12l-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4L12 2.5Z"/></svg>
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

          <div className="mt-7 flex max-w-xl items-center gap-3 rounded-lg border border-[#e7dfcf] bg-white px-4 py-3.5 shadow-sm sm:px-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5edda] text-[#8c6a27]" aria-hidden="true">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a7 7 0 0 0-7 7c0 5 7 11 7 11s7-6 7-11a7 7 0 0 0-7-7Z"/><path d="M12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"/></svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a793c]">Your sacred journey</p>
              <p className="mt-0.5 text-sm font-medium leading-5 text-slate-700 sm:text-base">Stay close to the places that matter</p>
            </div>
            <span className="hidden shrink-0 text-xs font-semibold text-slate-400 sm:block">Tiruvannamalai</span>
          </div>

          <ul className="mt-4 flex flex-wrap gap-2" aria-label="ROOMO Sacred highlights">
            {highlights.slice(0, 3).map((highlight) => (
              <li key={highlight} className="rounded-lg border border-[#e5e7eb] bg-white/70 px-3 py-2 text-xs leading-5 text-slate-600 sm:text-sm">{highlight}</li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute -inset-3 rounded-[1.25rem] border border-[#e6d9bd] sm:-inset-4" aria-hidden="true" />
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#e8e1d5] shadow-xl sm:aspect-[5/4] lg:aspect-[4/4.15]">
            <img src={heroImage} alt="Tiruvannamalai, the sacred home of Arunachala" className="h-full w-full object-cover" fetchPriority="high" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101b24]/70 via-transparent to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f2d99e] sm:text-xs">Arunachala Siva · Sacred View</p>
              <p className="mt-2 max-w-sm text-xl font-medium leading-snug sm:text-2xl">A peaceful stay for your sacred journey.</p>
            </div>
          </div>
          <div className="absolute -bottom-4 right-4 hidden max-w-[17rem] items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 shadow-lg sm:flex lg:-right-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#edf3f7] text-[#183b56]" aria-hidden="true">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 14.7 8.5 21 9.4l-4.5 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L3 9.4l6.3-.9L12 3Z"/></svg>
            </span>
            <div><p className="text-sm font-semibold text-slate-800">Thoughtfully chosen stays</p><p className="mt-0.5 text-xs leading-5 text-slate-500">Near temples, ashrams and Girivalam</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
