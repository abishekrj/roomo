import { useEffect, useState } from "react";

const API_URL = "http://localhost:5001/api/homepage";

export default function PilgrimGuide() {
  const [guide, setGuide] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setGuide(data?.content?.pilgrimGuide || null);
      })
      .catch(() => {
        if (!cancelled) setGuide(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!guide || guide.enabled === false || !Array.isArray(guide.cards) || guide.cards.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="pilgrim-guide-title" className="w-full bg-[#F7F8FA] py-12 sm:py-16 md:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
          {guide.eyebrow && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#2563A6] sm:text-sm">
              {guide.eyebrow}
            </p>
          )}
          {guide.title && (
            <h2 id="pilgrim-guide-title" className="text-2xl font-semibold leading-tight tracking-tight text-[#212529] sm:text-3xl lg:text-4xl">
              {guide.title}
            </h2>
          )}
          {guide.description && (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#5F6670] sm:text-base sm:leading-7">
              {guide.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {guide.cards.map((card, index) => (
            <article key={card.id || card.title || index} className="flex h-full flex-col rounded-lg border border-[#E4E8ED] bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EAF2FA] text-2xl text-[#2563A6]" aria-hidden="true">
                  {card.emoji || (index === 0 ? "◉" : index === 1 ? "✿" : "☼")}
                </div>
                {card.label && (
                  <span className="rounded-lg bg-[#F2F5F8] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#526170]">
                    {card.label}
                  </span>
                )}
              </div>
              {card.title && <h3 className="text-lg font-semibold leading-snug text-[#212529]">{card.title}</h3>}
              {card.description && <p className="mt-3 flex-1 text-sm leading-6 text-[#5F6670]">{card.description}</p>}
              {card.badge && (
                <div className="mt-5 border-t border-[#EDF0F3] pt-4">
                  <span className="inline-flex items-center gap-2 text-xs font-medium leading-5 text-[#2563A6]">
                    {card.badgeIcon && <span aria-hidden="true">✦</span>}
                    {card.badge}
                  </span>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
