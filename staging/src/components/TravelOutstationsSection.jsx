import { useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/homepage";

const fallbackDestinations = [
  { name: "Munnar", category: "Hill Station", description: "Tea gardens, misty hills & serene vibes", state: "Kerala", travelTime: "5 hr", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=900&q=85", href: "/properties?city=Munnar" },
  { name: "Tirupati", category: "Spiritual", description: "Divine darshan & peaceful surroundings", state: "Andhra Pradesh", travelTime: "4 hr", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=900&q=85", href: "/properties?city=Tirupati" },
  { name: "Goa", category: "Beach", description: "Beaches, nightlife & endless fun", state: "Goa", travelTime: "6 hr", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=85", href: "/properties?city=Goa" },
  { name: "Hampi", category: "Heritage", description: "Ancient ruins & timeless beauty", state: "Karnataka", travelTime: "7 hr", image: "https://images.unsplash.com/photo-1600100397608-f0107a7c9e9a?auto=format&fit=crop&w=900&q=85", href: "/properties?city=Hampi" },
  { name: "Rishikesh", category: "Adventure", description: "Adventure, spirituality & natural beauty", state: "Uttarakhand", travelTime: "6 hr", image: "https://images.unsplash.com/photo-1581793745862-99adera1d1b0?auto=format&fit=crop&w=900&q=85", href: "/properties?city=Rishikesh" }
];

const benefits = [
  { icon: "⌖", title: "Handpicked Destinations", description: "Curated for unforgettable experiences" },
  { icon: "⌂", title: "Comfortable Stays", description: "From cozy homestays to luxury resorts" },
  { icon: "▱", title: "Easy Travel Options", description: "Cab, bike, and driver services available" },
  { icon: "♢", title: "Safe & Reliable", description: "Your comfort and safety our priority" },
  { icon: "♡", title: "Local Experiences", description: "Explore culture, food and hidden gems" }
];

function normalizeDestination(item, index) {
  return {
    ...fallbackDestinations[index % fallbackDestinations.length],
    ...item,
    image: item.image || item.imageUrl || item.coverImage || fallbackDestinations[index % fallbackDestinations.length].image,
    href: item.href || item.url || (item.name ? "/properties?city=" + encodeURIComponent(item.name) : fallbackDestinations[index % fallbackDestinations.length].href)
  };
}

export default function TravelOutstationsSection() {
  const [section, setSection] = useState({ enabled: true, destinations: fallbackDestinations });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL, { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (cancelled) return;
        const config = data?.content?.travelOutstations || data?.content?.transportPromo || {};
        const destinations = Array.isArray(config.destinations) && config.destinations.length
          ? config.destinations.map(normalizeDestination)
          : fallbackDestinations;
        setSection({ ...config, destinations, enabled: config.enabled !== false });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (section.enabled === false) return null;
  const destinations = section.destinations || fallbackDestinations;
  const visibleDestinations = destinations.length > 5
    ? Array.from({ length: Math.min(5, destinations.length) }, (_, index) => destinations[(activeIndex + index) % destinations.length])
    : destinations;

  return (
    <section aria-labelledby="roomo-outstations-title" className="w-full overflow-hidden bg-gradient-to-b from-[#f4f9ff] via-white to-[#f7fbff] py-10 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#2563a6]/15 bg-[#2563a6]/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.15em] text-[#2563a6]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ffd54a]" /> ROOMO TRAVEL
            </span>
            <h2 id="roomo-outstations-title" className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[#123b63] sm:text-4xl">
              {section.title || "Go Further with ROOMO"}
              <span className="ml-2 text-[#2563a6]">{section.titleAccent || "Outstation Journeys"}</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              {section.description || "Discover memorable destinations, find a comfortable stay and plan the journey in one place."}
            </p>
          </div>
          <a href="/transport-booking" className="inline-flex min-h-11 items-center justify-center gap-2 justify-self-start rounded-lg bg-[#ffd54a] px-5 py-3 text-sm font-semibold text-[#123b63] shadow-sm transition hover:bg-[#ffca28] focus:outline-none focus:ring-2 focus:ring-[#ffd54a] focus:ring-offset-2 md:justify-self-end">
            {section.buttonLabel || "Plan Your Trip"} <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:grid-cols-3 sm:gap-4 sm:p-5 lg:grid-cols-5 lg:gap-0 lg:p-5">
          {benefits.map((benefit, index) => (
            <div key={benefit.title} className={`flex items-start gap-3 p-2 sm:p-3 ${index < benefits.length - 1 ? "lg:border-r lg:border-blue-100" : ""}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#2563a6]/8 text-2xl leading-none text-[#2563a6]" aria-hidden="true">{benefit.icon}</span>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold leading-5 text-[#123b63] sm:text-sm">{benefit.title}</h3>
                <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-11 flex items-end justify-between gap-4 sm:mt-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#2563a6]">Find your next favourite place</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#123b63] sm:text-3xl">{section.destinationsTitle || "Popular Outstation Destinations"}</h3>
            <p className="mt-2 text-sm text-slate-500">From misty hills to sacred cities — your next journey starts here.</p>
          </div>
          {destinations.length > 5 && <div className="flex shrink-0 gap-2">
            <button type="button" aria-label="Previous destinations" onClick={() => setActiveIndex(current => (current + destinations.length - 1) % destinations.length)} className="grid h-10 w-10 place-items-center rounded-full border border-blue-100 bg-white text-lg text-[#2563a6] transition hover:border-[#2563a6] hover:bg-blue-50">‹</button>
            <button type="button" aria-label="Next destinations" onClick={() => setActiveIndex(current => (current + 1) % destinations.length)} className="grid h-10 w-10 place-items-center rounded-full border border-blue-100 bg-white text-lg text-[#2563a6] transition hover:border-[#2563a6] hover:bg-blue-50">›</button>
          </div>}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {visibleDestinations.map((destination, index) => (
            <article key={destination.id || destination.name} className="group relative isolate min-h-[330px] overflow-hidden rounded-xl bg-slate-900 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <img src={destination.image} alt={destination.name} loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#061d2b] via-[#061d2b]/35 to-black/5" />
              <span className="absolute left-3 top-3 rounded-full bg-[#2563a6] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm">{destination.category || "Discover"}</span>
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h4 className="text-xl font-semibold">{destination.name}</h4>
                <p className="mt-1 min-h-10 text-xs leading-5 text-white/90">{destination.description || "Discover local favourites and memorable experiences."}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/90">
                  {destination.state && <span>⌖ {destination.state}</span>}
                  {destination.travelTime && <span>◷ {destination.travelTime}</span>}
                </div>
                <a href={destination.href} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#ffd54a] px-3.5 py-2 text-xs font-semibold text-[#123b63] transition hover:bg-[#ffca28]">
                  Explore Stays <span aria-hidden="true">→</span>
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="relative mt-8 overflow-hidden rounded-xl bg-[#123b63] px-5 py-6 text-white sm:px-8 sm:py-7 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(37,99,166,.8),transparent_60%)]" aria-hidden="true" />
          <div className="relative grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-8">
            <div>
              <p className="text-xl font-semibold italic sm:text-2xl">Your Next <span className="text-[#ffd54a]">Getaway Awaits</span></p>
              <p className="mt-1 text-sm text-blue-100">Make the journey part of the memory.</p>
            </div>
            <p className="max-w-xl text-sm leading-6 text-blue-50">Whether it’s a weekend escape or a longer vacation, ROOMO helps you discover the right destination, stay and travel option.</p>
            <a href="/transport-booking" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#ffd54a] px-5 py-3 text-sm font-semibold text-[#123b63] transition hover:bg-[#ffca28]">Plan Your Trip <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}
