import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = "http://localhost:5001/api/homepage";
const iconPaths = {
  pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
  chevron: <path d="m6 9 6 6 6-6"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>
};
function Icon({ name, className = "h-5 w-5" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}
function formatDate(value) {
  if (!value) return "";
  const date = new Date(value + "T12:00:00");
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(date);
}
function Counter({ label, description, value, min = 0, onChange }) {
  return <div className="flex items-center justify-between gap-5 py-3">
    <div><div className="text-sm font-medium text-slate-800">{label}</div>{description && <div className="mt-0.5 text-xs text-slate-500">{description}</div>}</div>
    <div className="flex items-center gap-3"><button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 text-lg text-slate-700 disabled:cursor-not-allowed disabled:opacity-35">−</button><span className="w-4 text-center text-sm tabular-nums">{value}</span><button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(value + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 text-lg text-slate-700">+</button></div>
  </div>;
}
export default function SearchSection({ variant = "default", onSearch }) {
  const rootRef = useRef(null);
  const destinationRef = useRef(null);
  const dateRef = useRef(null);
  const guestsRef = useRef(null);
  const [content, setContent] = useState(null);
  const [places, setPlaces] = useState([]);
  const [destination, setDestination] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [childrenAges, setChildrenAges] = useState([]);
  const [dateError, setDateError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [loadingPlaces, setLoadingPlaces] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(API_BASE, { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(API_BASE + "/destinations", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null)
    ]).then(([homepage, destinationData]) => {
      if (cancelled) return;
      if (homepage?.content) setContent(homepage.content);
      if (Array.isArray(destinationData?.places)) setPlaces(destinationData.places.filter(p => p && typeof p.name === "string"));
      setLoadingPlaces(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handlePointerDown = event => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setActiveDropdown("");
    };
    const handleKeyDown = event => { if (event.key === "Escape") setActiveDropdown(""); };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("pointerdown", handlePointerDown); document.removeEventListener("keydown", handleKeyDown); };
  }, []);

  useEffect(() => {
    setChildrenAges(current => Array.from({ length: children }, (_, index) => current[index] ?? ""));
  }, [children]);

  const suggestions = useMemo(() => {
    const query = destination.trim().toLocaleLowerCase();
    const list = places.filter(place => !query || place.name.toLocaleLowerCase().includes(query));
    return list.slice(0, Number(content?.searchSuggestionLimit) > 0 ? Math.min(10, Number(content.searchSuggestionLimit)) : 5);
  }, [places, destination, content]);
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const toggle = name => setActiveDropdown(current => current === name ? "" : name);
  const shiftMonth = amount => setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const dateKey = date => date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-") : "";
  const selectCalendarDate = date => { const value = dateKey(date); if (!checkIn || checkOut || value <= checkIn) { setCheckIn(value); setCheckOut(""); } else setCheckOut(value); setDateError(""); };
  const renderMonth = month => {
    const offset = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const days = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
    return <div className="min-w-0"><div className="mb-3 text-center text-sm font-semibold text-slate-800">{new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(month)}</div><div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-slate-500">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => <span key={day} className="py-1">{day}</span>)}</div><div className="grid grid-cols-7 gap-y-1">{days.map((date, index) => { if (!date) return <span key={"empty-" + index} />; const value = dateKey(date), disabled = value < minDate, selected = value === checkIn || value === checkOut, inRange = checkIn && checkOut && value > checkIn && value < checkOut; const cls = "mx-auto grid h-9 w-9 place-items-center rounded-lg text-sm transition " + (selected ? "bg-roomo-navy font-semibold text-white" : inRange ? "bg-blue-50 text-roomo-navy" : "text-slate-700 hover:bg-blue-50") + " disabled:cursor-not-allowed disabled:text-slate-300"; return <button key={value} type="button" disabled={disabled} onClick={() => selectCalendarDate(date)} aria-label={value} aria-pressed={selected} className={cls}>{date.getDate()}</button>; })}</div></div>;
  };
  const choosePlace = place => { setSelectedPlace(place); setDestination(place.name); setActiveDropdown(""); };
  const submit = event => {
    event.preventDefault();
    setDateError("");
    if (checkIn && checkOut && checkOut <= checkIn) { setDateError(content?.searchDateError || "Check-out must be after check-in."); setActiveDropdown("dates"); return; }
    const params = new URLSearchParams();
    if (destination.trim()) params.set("ss", destination.trim());
    if (checkIn) params.set("checkin", checkIn);
    if (checkOut) params.set("checkout", checkOut);
    params.set("group_adults", String(adults));
    params.set("group_children", String(children));
    childrenAges.forEach((age, index) => { if (age !== "") params.append("age", String(age)); });
    params.set("no_rooms", String(rooms));
    if (selectedPlace?.id) params.set("destinationId", selectedPlace.id);
    const query = params.toString();
    if (onSearch) onSearch({ destination, selectedPlace, checkIn, checkOut, adults, children, childrenAges, rooms, query });
    else window.location.assign((content?.searchResultsUrl || "/roomo-search-results.html") + (query ? "?" + query : ""));
  };

  const baseLabel = content?.searchDestinationLabel || "SACRED DESTINATION";
  const datesLabel = content?.searchDatesLabel || "YOUR STAY";
  const guestsLabel = content?.searchGuestsLabel || "GUESTS & ROOMS";
  const heading = content?.searchTrendingTitle || "TRENDING DESTINATIONS";
  const destinationPlaceholder = content?.searchDestinationPlaceholder || "Where would you like to stay?";
  const checkInLabel = content?.searchCheckInLabel || "CHECK-IN";
  const checkOutLabel = content?.searchCheckOutLabel || "CHECK-OUT";
  const guestSummary = [`${adults} ${adults === 1 ? (content?.searchAdultSingular || "Adult") : (content?.searchAdultPlural || "Adults")}`, children ? `${children} ${children === 1 ? (content?.searchChildSingular || "Child") : (content?.searchChildPlural || "Children")}` : "", `${rooms} ${rooms === 1 ? (content?.searchRoomSingular || "Room") : (content?.searchRoomPlural || "Rooms")}`].filter(Boolean).join(", ");
  const fieldClass = "flex min-h-[60px] min-w-0 items-center gap-3 rounded-lg border border-slate-300 bg-white px-3.5 text-left transition focus-within:border-roomo-blue focus-within:ring-2 focus-within:ring-blue-100 sm:px-4";
  const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500";
  const panelClass = "absolute left-0 top-[calc(100%+8px)] z-[80] w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-xl sm:min-w-[300px]";
  return <section ref={rootRef} className={`relative z-30 mx-auto w-full max-w-7xl px-4 sm:px-6 ${variant === "hero" ? "py-4 sm:py-5" : "py-5 sm:py-7"}`}>
    <form onSubmit={submit} className="relative rounded-xl border border-slate-200 bg-white p-2 shadow-md sm:p-3">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(220px,1.25fr)_minmax(220px,1fr)_minmax(220px,1fr)_auto]">
        <div ref={destinationRef} className="relative min-w-0">
          <label htmlFor="roomo-search-destination" className={labelClass}>{baseLabel}</label>
          <div className={fieldClass}><Icon name="pin" className="h-5 w-5 shrink-0 text-roomo-blue"/><input id="roomo-search-destination" value={destination} onFocus={() => setActiveDropdown("destination")} onChange={e => { setDestination(e.target.value); setSelectedPlace(null); setActiveDropdown("destination"); }} placeholder={destinationPlaceholder} autoComplete="off" className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" aria-expanded={activeDropdown === "destination"} aria-controls="roomo-destination-suggestions" /></div>
          {activeDropdown === "destination" && <div id="roomo-destination-suggestions" className={panelClass} role="listbox">
            {heading && !destination.trim() && <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-roomo-blue">{heading}</div>}
            {suggestions.length ? suggestions.map(place => <button type="button" role="option" aria-selected={selectedPlace?.id === place.id} key={place.id || place.name} onClick={() => choosePlace(place)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><Icon name="pin" className="h-4 w-4 shrink-0 text-slate-400"/><span>{place.name}</span></button>) : <p className="px-2 py-3 text-sm text-slate-500">{loadingPlaces ? (content?.searchLoadingLabel || "Loading destinations…") : (content?.searchNoDestinationsLabel || "No destinations found")}</p>}
          </div>}
        </div>
        <div ref={dateRef} className="relative min-w-0">
          <label className={labelClass}>{datesLabel}</label>
          <button type="button" className={fieldClass + " w-full"} onClick={() => toggle("dates")} aria-expanded={activeDropdown === "dates"}><Icon name="calendar" className="h-5 w-5 shrink-0 text-roomo-blue"/><span className="min-w-0 flex-1 text-sm text-slate-800"><span className="block truncate">{checkIn ? formatDate(checkIn) : checkInLabel}<span className="mx-2 text-slate-300">—</span>{checkOut ? formatDate(checkOut) : checkOutLabel}</span></span><Icon name="chevron" className="h-4 w-4 shrink-0 text-slate-400"/></button>
          {activeDropdown === "dates" && <div className={panelClass + " sm:min-w-[340px]"}>
            <div className="mb-3 flex items-center justify-between gap-3"><div><div className="text-sm font-semibold text-slate-900">{content?.searchCalendarTitle || "Select your dates"}</div><p className="mt-1 text-xs text-slate-500">{checkIn ? (checkOut ? formatDate(checkIn) + " – " + formatDate(checkOut) : formatDate(checkIn) + " · Select check-out") : "Choose check-in, then check-out"}</p></div><button type="button" onClick={() => setActiveDropdown("")} aria-label={content?.searchCloseLabel || "Close calendar"} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><Icon name="close" className="h-4 w-4"/></button></div>
            <div className="mb-3 flex items-center justify-between"><button type="button" onClick={() => shiftMonth(-1)} disabled={calendarMonth.getFullYear() === new Date().getFullYear() && calendarMonth.getMonth() === new Date().getMonth()} aria-label="Previous month" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30">‹</button><div className="text-xs text-slate-500">Select check-in and check-out</div><button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600">›</button></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{renderMonth(calendarMonth)}{renderMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}</div>
            {dateError && <p role="alert" className="mt-2 text-xs text-red-600">{dateError}</p>}
            <button type="button" disabled={!checkIn || !checkOut} onClick={() => setActiveDropdown("")} className="mt-4 w-full rounded-lg bg-roomo-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#102b40] disabled:cursor-not-allowed disabled:opacity-40">{content?.searchDoneLabel || "Apply & Done"}</button>
          </div>}
        </div>
        <div ref={guestsRef} className="relative min-w-0">
          <label className={labelClass}>{guestsLabel}</label>
          <button type="button" className={fieldClass + " w-full"} onClick={() => toggle("guests")} aria-expanded={activeDropdown === "guests"}><Icon name="users" className="h-5 w-5 shrink-0 text-roomo-blue"/><span className="min-w-0 flex-1 truncate text-sm text-slate-800">{guestSummary}</span><Icon name="chevron" className="h-4 w-4 shrink-0 text-slate-400"/></button>
          {activeDropdown === "guests" && <div className={panelClass + " sm:min-w-[320px]"}>
            <Counter label={content?.searchAdultsLabel || "Adults"} description={content?.searchAdultsDescription || "Age 12+ years"} value={adults} min={1} onChange={setAdults}/>
            <div className="border-t border-slate-100"><Counter label={content?.searchChildrenLabel || "Children"} description={content?.searchChildrenDescription || "0–12 years"} value={children} min={0} onChange={setChildren}/></div>
            {children > 0 && <div className="border-t border-slate-100 py-3"><div className="mb-2 text-xs font-medium text-slate-600">{content?.searchChildrenAgeLabel || "Children’s ages"}</div><div className="grid grid-cols-2 gap-2">{childrenAges.map((age, index) => <label key={index} className="text-xs text-slate-600">{(content?.searchChildLabel || "Child") + " " + (index + 1)}<select value={age} onChange={e => setChildrenAges(current => current.map((item, i) => i === index ? e.target.value : item))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"><option value="">{content?.searchAgePlaceholder || "Age"}</option>{Array.from({ length: 18 }, (_, i) => <option key={i} value={i}>{i}</option>)}</select></label>)}</div></div>}
            <div className="border-t border-slate-100"><Counter label={content?.searchRoomsLabel || "Rooms / Kutir"} description={content?.searchRoomsDescription || "Sanctuary count"} value={rooms} min={1} onChange={setRooms}/></div>
            <button type="button" onClick={() => setActiveDropdown("")} className="mt-2 w-full rounded-lg bg-roomo-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#102b40]">{content?.searchDoneLabel || "Apply & Done"}</button>
          </div>}
        </div>
        <div className="flex items-end"><button type="submit" className="inline-flex min-h-[60px] w-full items-center justify-center gap-2 rounded-lg bg-roomo-navy px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#102b40] focus:outline-none focus:ring-2 focus:ring-roomo-blue focus:ring-offset-2"><Icon name="search" className="h-5 w-5"/>{content?.searchButtonLabel || "Seek Blessed Stays"}</button></div>
      </div>
    </form>
  </section>;
}
