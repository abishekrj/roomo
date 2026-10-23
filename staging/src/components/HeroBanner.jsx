import mobileHeroImage from "../../../roomo-frontend/assets/roomo-hero-banner.jpg";
import desktopHeroImage from "../../../roomo-frontend/assets/hero-desktop.png";

export default function HeroBanner() {
  return (
    <section aria-labelledby="home-hero-title" className="overflow-hidden border-b border-slate-200 bg-[#f7f5f0]">
      <div className="block w-full leading-none md:hidden">
        <img src={mobileHeroImage} alt="ROOMO Sacred — Tiruvannamalai" className="block h-auto w-full object-contain" fetchPriority="high" decoding="async" />
      </div>
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 pb-8 pt-9 sm:px-7 sm:pb-12 sm:pt-14 md:grid-cols-[1.08fr_.92fr] lg:gap-12 lg:px-8 lg:pb-14 lg:pt-12">
        <div className="relative z-10">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#2563a6]/25 bg-white/80 px-3.5 py-2 text-xs font-semibold leading-5 text-[#2563a6] shadow-sm sm:text-sm">
            <svg className="h-4 w-4 shrink-0 text-[#2563a6]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5 14.4 9.6 21.5 12l-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4L12 2.5Z" /></svg>
            <span>Abode of Silence &amp; Divine Fire (Agni Sthalam)</span>
          </div>
          <h1 id="home-hero-title" className="max-w-2xl text-[2.5rem] font-normal leading-[1.12] tracking-tight text-[#212529]">
            Find Sacred Solace at
            <span className="mt-1 block font-semibold text-[#2563a6]">Holy Arunachala</span>
            <span className="sr-only"> stays and accommodation in Tiruvannamalai</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Hand-curated sanctuary stays, peaceful ashram guest rooms, and heritage havelis situated in revered proximity to Annamalaiyar Temple &amp; Sri Ramanasramam.</p>
          <a href="/roomo-search-results.html" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#2563a6] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1e4f85] focus:outline-none focus:ring-2 focus:ring-[#2563a6] focus:ring-offset-2 sm:text-base">
            Browse Rooms
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
          </a>
        </div>
        <div className="relative mx-auto hidden w-full max-w-xl md:block lg:max-w-none">
          <div className="relative h-[260px] w-full overflow-hidden rounded-t-[200px] rounded-b-[28px] border-[6px] border-white bg-[#e8e1d5] shadow-xl min-[992px]:h-[380px]">
            <img src={desktopHeroImage} alt="Arunachala Hill in Tiruvannamalai, Tamil Nadu" className="block h-full w-full object-cover" fetchPriority="high" decoding="async" />
          </div>
        </div>
      </div>
    </section>
  );
}