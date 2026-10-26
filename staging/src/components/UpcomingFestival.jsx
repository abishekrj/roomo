import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5001/api/homepage";

function getTimeLeft(targetDate, now) {
  const target = new Date(targetDate).getTime();
  if (!Number.isFinite(target)) return null;
  const distance = target - now;
  if (distance <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance % 86400000) / 3600000),
    minutes: Math.floor((distance % 3600000) / 60000),
    seconds: Math.floor((distance % 60000) / 1000),
    passed: false
  };
}

function CountdownUnit({ value, label }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/25 bg-white/10 px-2 py-3 text-center sm:px-4 sm:py-4">
      <div className="text-2xl font-semibold tabular-nums text-white sm:text-3xl">{String(value).padStart(2, "0")}</div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/75 sm:text-xs">{label}</div>
    </div>
  );
}

export default function UpcomingFestival() {
  const [content, setContent] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL, { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!cancelled) setContent(data?.content || null); })
      .catch(() => { if (!cancelled) setContent(null); });
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const festivalDate = content?.festivalDate;
  const countdown = useMemo(() => festivalDate ? getTimeLeft(festivalDate, now) : null, [festivalDate, now]);
  if (content?.festivalSectionEnabled === false || !content?.festivalTitle || !festivalDate) return null;

  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata"
  }).format(new Date(festivalDate));

  return (
    <section aria-labelledby="upcoming-festival-title" className="w-full bg-[#2563a6] py-8 sm:py-10 lg:py-12">
      <div className="mx-auto grid w-full max-w-7xl items-stretch gap-5 px-4 sm:px-6 md:grid-cols-2 md:gap-8 lg:gap-10">
        <div className="relative min-h-[230px] overflow-hidden rounded-lg bg-white/10 sm:min-h-[300px]">
          {content.festivalImageUrl ? (
            <img src={content.festivalImageUrl} alt={content.festivalTitle || "Upcoming festival"} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center border border-white/20 bg-white/5 px-6 text-center">
              <div><span aria-hidden="true" className="text-4xl text-white">✦</span><p className="mt-3 text-sm font-medium text-white/85">Festival image can be added in Super Admin</p></div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 sm:text-sm">{content?.festivalEyebrow || "Upcoming Festival"}</p>
            <h2 id="upcoming-festival-title" className="max-w-xl text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">{content.festivalTitle}</h2>
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-white sm:text-base"><span aria-hidden="true">◷</span>{dateLabel}</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-col justify-center rounded-lg border border-white/20 bg-white/10 p-4 sm:p-6 lg:p-8">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/85 sm:text-sm">{countdown?.passed ? (content?.festivalCountdownCompleteLabel || "Festival day has arrived") : (content?.festivalCountdownLabel || "Time until the celebration")}</p>
          {countdown ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CountdownUnit value={countdown.days} label="Days" />
            <CountdownUnit value={countdown.hours} label="Hours" />
            <CountdownUnit value={countdown.minutes} label="Minutes" />
            <CountdownUnit value={countdown.seconds} label="Seconds" />
          </div> : <p className="text-center text-sm text-white/85">Festival date will be announced soon.</p>}
        </div>
      </div>
    </section>
}
