import mobileHeroImage from "../../../roomo-frontend/assets/roomo-hero-banner.jpg";

const desktopHeroImage = "https://lh3.googleusercontent.com/aida/AEtjO1WPqpw7U-3cK3DXCWtQksdvMd_FQT7Rln8b36_TSmYoqFe_eoL-rZTeovlHRw4_W7FTImYN5QacCN-1Cz14CYXGLt86TlJglU6w9p0m_aon-hpDBhxdS8xRvjZ_UKVSjjmzDRlYBzMlKmPFnt3Xn6skMZ9EGrQA8ktbnSt1NSIYOsb58ERgJrMAl7HfibYOkZFXHDc94lf5tOduqxrlZW6NqVJjEpshssz6wkLAr39DOdQTOhry7YUfHg";

export default function HeroBanner() {
  return (
    <section aria-labelledby="home-hero-title" className="overflow-hidden border-b border-slate-200 bg-[#f7f5f0]">
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
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="relative h-[260px] w-full overflow-hidden rounded-lg bg-[#e8e1d5] shadow-xl sm:h-[320px] lg:h-[380px]">
            <picture>
              <source media="(max-width: 767.98px)" srcSet={mobileHeroImage} />
              <img src={desktopHeroImage} alt="Arunachala Hill in Tiruvannamalai, Tamil Nadu" className="block h-full w-full object-cover" width="640" height="380" fetchPriority="high" />
            </picture>
          </div>
        </div>
      </div>
    </section>
  );
}
