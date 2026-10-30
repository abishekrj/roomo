import { useEffect, useRef, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const API = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/transport";
const AUTH_API = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100";
function PlaceAutocomplete({ label, name, value, onChange, placeholder, inputRef, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3) { setSuggestions([]); setOpen(false); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API}/place-suggestions?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await response.json().catch(() => ({}));
        if (response.ok) { setSuggestions(data.suggestions || []); setOpen(true); }
        else setSuggestions([]);
      } catch (error) {
        if (error.name !== "AbortError") setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value]);

  function choose(place) {
    onChange({ target: { name, value: place.placeName } });
    setSuggestions([]);
    setOpen(false);
    onSelect?.(place.placeName);
  }

  return <label className="relative block min-w-0 text-sm font-medium">{label}
    <input ref={inputRef} className={inputClass} name={name} required minLength={3} maxLength={500} autoComplete="off" placeholder={placeholder} value={value} onChange={event => { onChange(event); setOpen(true); }} onFocus={() => suggestions.length && setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
    {loading && <span className="absolute right-3 top-10 text-xs font-normal text-slate-400">Searching…</span>}
    {open && suggestions.length > 0 && <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
      {suggestions.map(place => <button key={place.id} type="button" onMouseDown={event => event.preventDefault()} onClick={() => choose(place)} className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-blue-50">
        <span className="mt-0.5 text-[#2563a6]">⌖</span><span className="min-w-0"><span className="block text-sm font-medium text-slate-800">{place.name}</span><span className="mt-0.5 block text-xs font-normal text-slate-500">{place.placeName}</span></span>
      </button>)}
    </div>}
  </label>;
}

function csrfHeaders() {
  const item = document.cookie.split("; ").find(part => part.startsWith("roomo_csrf="));
  return item ? { "X-CSRF-Token": decodeURIComponent(item.slice("roomo_csrf=".length)) } : {};
}

export default function TransportBookingPage() {
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState("checking");
  const [form, setForm] = useState(() => { const params=new URLSearchParams(window.location.search); const destination=params.get("destination")||""; return {guestPhone:"",pickupLocation:params.get("pickup")||"",dropoffLocation:destination,travelAt:"",passengerCount:"2",vehicleType:"CAR",notes:params.get("source")==="nearby-place"&&destination?"Destination selected from Famous Places Nearby: "+destination:""}; });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeBusy, setRouteBusy] = useState(false);
  const [routeError, setRouteError] = useState("");
  const destinationInputRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(AUTH_API + "/guest-auth/me", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) { setAuthState("signed-out"); return; }
        if (!response.ok || !data.user) throw new Error(data.message || "Unable to verify your ROOMO account.");
        setUser(data.user);
        setForm(current => ({ ...current, guestPhone: data.user.phoneNumber || current.guestPhone, pickupLocation: current.pickupLocation || data.user.defaultPickupLocation || "" }));
        setAuthState("signed-in");
      })
      .catch(e => { if (e.name !== "AbortError") { setError(e.message || "Unable to verify your session."); setAuthState("error"); } });
    return () => controller.abort();
  }, []);

  function change(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    if (name === "pickupLocation" || name === "dropoffLocation") { setRoute(null); setRouteError(""); }
  }

  async function submit(event) {
    event.preventDefault();
    if (!user || authState !== "signed-in") { setError("Please sign in to your ROOMO account before requesting a driver."); return; }
    setBusy(true); setError(""); setSuccess(null);
    try {
      const response = await fetch(API + "/bookings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ ...form, passengerCount: Number(form.passengerCount), travelAt: new Date(form.travelAt).toISOString() })
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error("Your session has expired. Please sign in again to request a driver.");
      if (!response.ok) throw new Error(data.message || "Unable to submit your transport request.");
      setSuccess(data.booking);
      setForm(current => ({ ...current, pickupLocation: "", dropoffLocation: "", travelAt: "", notes: "" }));
      setRoute(null); setRouteError("");
    } catch (e) { setError(e.message || "Unable to submit your request. Please try again."); }
    finally { setBusy(false); }
  }


  function encodePolyline(coordinates) {
    let lastLat = 0, lastLng = 0;
    const parts = [];
    const encodeValue = value => {
      let encoded = "";
      let current = value < 0 ? ~(value << 1) : value << 1;
      while (current >= 0x20) { encoded += String.fromCharCode((0x20 | (current & 0x1f)) + 63); current >>= 5; }
      return encoded + String.fromCharCode(current + 63);
    };
    for (const [lng, lat] of coordinates) {
      const nextLat = Math.round(lat * 1e5), nextLng = Math.round(lng * 1e5);
      parts.push(encodeValue(nextLat - lastLat), encodeValue(nextLng - lastLng));
      lastLat = nextLat; lastLng = nextLng;
    }
    return parts.join("");
  }

  async function calculateRoute(originValue = form.pickupLocation, destinationValue = form.dropoffLocation) {
    if (originValue.trim().length < 3 || destinationValue.trim().length < 3) {
      setRouteError("Enter both pickup and destination to calculate the route.");
      return;
    }
    setRouteBusy(true); setRouteError(""); setRoute(null);
    try {
      const response = await fetch(API + "/route-distance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: originValue.trim(), destination: destinationValue.trim() })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to calculate this route.");
      setRoute(data);
    } catch (e) { setRouteError(e.message || "Unable to calculate the route. Please try again."); }
    finally { setRouteBusy(false); }
  }

  const mapToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const routeMapUrl = route && mapToken && route.geometry?.coordinates?.length
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/path-5+2563a6-0.85(${encodeURIComponent(encodePolyline(route.geometry.coordinates))})/pin-s-a+2563a6(${route.origin.coordinates[0]},${route.origin.coordinates[1]}),pin-l-b+facc15(${route.destination.coordinates[0]},${route.destination.coordinates[1]})/auto/900x420@2x?access_token=${encodeURIComponent(mapToken)}&padding=48`
    : null;

  const bookingReturnPath = window.location.pathname + window.location.search;
  const loginHref = "/login?returnTo=" + encodeURIComponent(bookingReturnPath);
  const signupHref = "/signup?returnTo=" + encodeURIComponent(bookingReturnPath);

  return <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-roomo-ink"><Header /><main className="flex-1 bg-slate-50 pb-12"><section className="relative overflow-visible bg-[#2563a6] px-4 py-12 text-white sm:px-6 sm:py-16"><div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[36px] border-white/5"></div><div className="absolute -bottom-36 left-[12%] h-72 w-72 rounded-full border-[28px] border-white/5"></div></div><div className="relative mx-auto max-w-7xl"><div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[.18em]">ROOMO Travel · Outstation rides</span><h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">Your journey begins here.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">Find your route, explore the distance and request a comfortable ride to Tiruvannamalai and beyond.</p></div></div></section><div className="relative z-10 mx-auto -mt-6 w-full max-w-7xl px-4 sm:px-6"><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-8"><div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#2563a6]">Plan your journey</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">Where would you like to go?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Enter your route and travel details. Select a place from the suggestions for accurate route calculation.</p></div><a href="/my-bookings" className="text-sm font-semibold text-[#2563a6] hover:underline">My Travel →</a></div>
      {authState === "checking" && <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Checking your ROOMO account…</div>}
      {authState === "signed-out" && <div className="rounded-lg border border-blue-100 bg-blue-50 p-5"><h3 className="font-semibold text-slate-900">Sign in to request a driver</h3><p className="mt-2 text-sm leading-6 text-slate-600">Your trip requests are saved to your account, so you can review pickup details and booking status any time in My Travel.</p><div className="mt-5 flex flex-wrap gap-3"><a href={loginHref} className="inline-flex items-center justify-center rounded-lg bg-[#2563a6] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1e4f85]">Sign in</a><a href={signupHref} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Create an account</a></div></div>}
      {authState === "error" && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Unable to verify your account. Please refresh the page."}<button type="button" className="ml-2 font-semibold underline" onClick={() => window.location.reload()}>Try again</button></div>}
      {authState === "signed-in" && <><div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Requesting as</p><p className="mt-1 font-semibold text-slate-900">{user.fullName}</p><p className="mt-1 text-sm text-slate-600">{user.email}</p><a href="/my-bookings" className="mt-2 inline-block text-sm font-semibold text-[#2563a6] hover:underline">View My Travel →</a></div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold text-emerald-900">Your driver request has been received.</p><p className="mt-1 text-sm text-emerald-800">Reference: <strong>{success.bookingCode}</strong> · Status: {success.status}.</p><p className="mt-2 text-sm text-emerald-800">You can track this request from My Travel.</p><a href="/my-bookings" className="mt-3 inline-flex rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">Go to My Travel →</a></div>}
      <form onSubmit={submit} className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-medium">Mobile number<input className={inputClass} name="guestPhone" autoComplete="tel" type="tel" required minLength={7} maxLength={32} value={form.guestPhone} onChange={change} placeholder="Enter a contact number for this trip" /></label>
        <div className="col-span-full grid grid-cols-2 items-start gap-3 sm:gap-5"><PlaceAutocomplete label="From" name="pickupLocation" value={form.pickupLocation} onChange={change} inputRef={null} onSelect={() => destinationInputRef.current?.focus()} placeholder="Pickup place" /><PlaceAutocomplete label="To" name="dropoffLocation" value={form.dropoffLocation} onChange={change} inputRef={destinationInputRef} onSelect={place => calculateRoute(form.pickupLocation, place)} placeholder="Destination" /></div>
        <div className="lg:col-span-3 -mt-1">
          {routeBusy && <p className="text-sm font-medium text-[#2563a6]">Finding your driving distance and travel time…</p>}
          {routeError && <p role="alert" className="mt-2 text-sm text-red-600">{routeError}</p>}
          {route && <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <div className="grid grid-cols-2 gap-3 p-4">
              <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Driving distance</p><p className="mt-1 text-xl font-semibold text-slate-900">{route.distanceKm} km</p></div>
              <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Estimated drive time</p><p className="mt-1 text-xl font-semibold text-slate-900">{route.durationText}</p></div>
            </div>
            <div className="border-t border-slate-200 px-4 py-3 text-xs leading-5 text-slate-600"><span className="font-semibold text-slate-800">Route:</span> {route.origin.name} → {route.destination.name}</div>
            {routeMapUrl ? <img src={routeMapUrl} alt={`Driving route from ${route.origin.name} to ${route.destination.name}`} className="block h-auto w-full bg-slate-100" loading="lazy" /> : <div className="px-4 pb-4 text-xs text-slate-500">Add VITE_MAPBOX_ACCESS_TOKEN to the frontend .env.local file to display the route map. The distance and duration are available above.</div>}
            <p className="px-4 py-3 text-xs text-slate-500">Estimate based on the driving route. Actual travel time may vary with traffic and road conditions.</p>
          </div>}
        </div>
        <label className="text-sm font-medium">Pickup date & time<input className={inputClass} name="travelAt" type="datetime-local" required min={new Date(Date.now() + 60000).toISOString().slice(0,16)} value={form.travelAt} onChange={change} /></label>
        <label className="text-sm font-medium">Vehicle type<select className={inputClass} name="vehicleType" value={form.vehicleType} onChange={change}><option value="CAR">Car</option><option value="SUV">SUV</option><option value="VAN">Van</option><option value="TEMPO_TRAVELLER">Tempo traveller</option></select></label>
        <label className="text-sm font-medium">Passengers<input className={inputClass} name="passengerCount" type="number" min="1" max="30" required value={form.passengerCount} onChange={change} /></label>
        <label className="text-sm font-medium lg:col-span-3">Trip notes (optional)<textarea className={inputClass} name="notes" rows="3" maxLength={1000} placeholder="Luggage, additional stops or pickup instructions" value={form.notes} onChange={change} /></label>
        <div className="lg:col-span-3"><button disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#2563a6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1e4f85] disabled:cursor-wait disabled:opacity-60 sm:w-auto">{busy ? "Sending request…" : "Request a driver →"}</button><p className="mt-3 text-xs leading-5 text-slate-500">Submitting this form requests a ride; it does not guarantee a driver until the trip is confirmed.</p></div>
      </form></>}
    </section></div></main><Footer /></div>;
}
