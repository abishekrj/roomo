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
    <div className="min-w-0 rounded-lg border border-white/25 bg-white/10 px-3 py-4 text-center sm:px-5 sm:py-5">
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
    <section aria-labelledby="upcoming-festival-title" className="w-full bg-[#f4f7fb] py-8 sm:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-lg bg-[#2563a6] px-4 py-7 text-center text-white sm:px-8 sm:py-9 lg:px-12 lg:py-11">
          <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 sm:text-sm">
            {content?.festivalEyebrow || "Upcoming Festival"}
          </p>
          <h2 id="upcoming-festival-title" className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
            {content.festivalTitle}
          </h2>
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-white/90 sm:text-base">
            <span aria-hidden="true">◷</span>{dateLabel}
          </p>
          <p className="mb-5 mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-white/85 sm:mb-6 sm:text-sm">
            {countdown?.passed ? (content?.festivalCountdownCompleteLabel || "Festival day has arrived") : (content?.festivalCountdownLabel || "Time until the celebration")}
          </p>
          {countdown ? (
            <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <CountdownUnit value={countdown.days} label="Days" />
              <CountdownUnit value={countdown.hours} label="Hours" />
              <CountdownUnit value={countdown.minutes} label="Minutes" />
              <CountdownUnit value={countdown.seconds} label="Seconds" />
            </div>
          ) : (
            <p className="text-center text-sm text-white/85">Festival date will be announced soon.</p>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
