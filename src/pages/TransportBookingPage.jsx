import { useEffect, useRef, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const API = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/transport";
const AUTH_API = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";
const inputClass = "mt-1.5 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3.5 text-sm font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2563a6] focus:bg-white focus:ring-4 focus:ring-blue-100";
function PlaceAutocomplete({ label, name, value, onChange, placeholder, inputRef, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const selectedPlaceNameRef = useRef("");

  useEffect(() => {
    const query = value.trim();
    if (query === selectedPlaceNameRef.current) { setSuggestions([]); setOpen(false); return; }
    if (query.length < 3) { setSuggestions([]); setOpen(false); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API}/place-suggestions?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await response.json().catch(() => ({}));
        if (response.ok) { const results = data.suggestions || []; setSuggestions(results); setOpen(results.length > 0); }
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
    // Display only the main place name in the input; retain the full prediction
    // separately for accurate route calculation.
    selectedPlaceNameRef.current = place.name;
    onChange({ target: { name, value: place.name } });
    setSuggestions([]);
    setOpen(false);
    onSelect?.({ ...place, displayName: place.name });
  }

  return <label className="relative block min-w-0 text-sm font-medium">{label}
    <input ref={inputRef} className={inputClass} name={name} required minLength={3} maxLength={500} autoComplete="off" placeholder={placeholder} value={value} onChange={event => { selectedPlaceNameRef.current = ""; setSuggestions([]); setOpen(false); onChange(event); }} onFocus={() => { if (value.trim().length < 3 || value.trim() === selectedPlaceNameRef.current) setOpen(false); }} onBlur={() => setTimeout(() => setOpen(false), 150)} />
    {loading && <span className="absolute right-3 top-10 text-xs font-normal text-slate-400">Searching…</span>}
    {open && suggestions.length > 0 && <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
      {suggestions.map(place => <button key={place.id} type="button" onMouseDown={event => event.preventDefault()} onClick={() => choose(place)} className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-blue-50">
        <span className="mt-0.5 text-[#2563a6]">⌖</span><span className="min-w-0"><span className="block text-sm font-medium text-slate-800">{place.name}</span><span className="mt-0.5 block text-xs font-normal text-slate-500">{place.placeName}</span></span>
      </button>)}
    </div>}
  </label>;
}

function GoogleRouteMap({ route, origin, destination }) {
  const mapRef = useRef(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) { setError("Missing VITE_GOOGLE_MAPS_API_KEY in the project-root .env.local file."); return; }
    let cancelled = false;
    const loadMap = () => new Promise((resolve, reject) => {
      if (window.google?.maps) return resolve();
      const existing = document.querySelector('script[data-roomo-google-maps="true"]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.dataset.roomoGoogleMaps = "true";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    loadMap().then(() => {
      if (cancelled || !mapRef.current) return;
      const points = route?.geometry?.coordinates || [];
      if (points.length < 2) { setError("Google did not return route geometry."); return; }
      const path = points.map(([lng, lat]) => ({ lat, lng }));
      const map = new window.google.maps.Map(mapRef.current, {
        center: path[Math.floor(path.length / 2)],
        zoom: 8,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });
      const line = new window.google.maps.Polyline({ path, geodesic: true, strokeColor: "#2563a6", strokeOpacity: 0.95, strokeWeight: 5 });
      line.setMap(map);
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds, 48);
      new window.google.maps.Marker({ map, position: path[0], title: origin });
      new window.google.maps.Marker({ map, position: path[path.length - 1], title: destination });
    }).catch(() => { if (!cancelled) setError("Google Maps could not load. Check the frontend API key and its website/API restrictions."); });
    return () => { cancelled = true; };
  }, [route, origin, destination]);
  return <>{error && <p role="alert" className="px-4 py-4 text-sm text-red-700">{error}</p>}<div ref={mapRef} className="h-[420px] w-full bg-slate-100" aria-label={`Driving route from ${origin} to ${destination}`} /></>;
}

function csrfHeaders() {
  const item = document.cookie.split("; ").find(part => part.startsWith("roomo_csrf="));
  return item ? { "X-CSRF-Token": decodeURIComponent(item.slice("roomo_csrf=".length)) } : {};
}

export default function TransportBookingPage() {
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState("checking");
  const [form, setForm] = useState(() => { const params=new URLSearchParams(window.location.search); return {pickupLocation:params.get("pickup")||"",dropoffLocation:"",travelAt:"",passengerCount:"2",vehicleType:"CAR",guestPhone:"",notes:""}; });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [route, setRoute] = useState(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routeBusy, setRouteBusy] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [mapError, setMapError] = useState("");
  const destinationInputRef = useRef(null);
  const travelDateInputRef = useRef(null);
  const selectedFromRef = useRef(null);
  const selectedToRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(AUTH_API + "/guest-auth/me", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) { setAuthState("signed-out"); return; }
        if (!response.ok || !data.user) throw new Error(data.message || "Unable to verify your ROOMO account.");
        setUser(data.user);
        setForm(current => ({ ...current, guestPhone: data.user.phoneNumber || "", pickupLocation: current.pickupLocation || data.user.defaultPickupLocation || "" }));
        setAuthState("signed-in");
      })
      .catch(e => { if (e.name !== "AbortError") { setError(e.message || "Unable to verify your session."); setAuthState("error"); } });
    return () => controller.abort();
  }, []);

  function swapLocations() {
    setForm(current => ({ ...current, pickupLocation: current.dropoffLocation, dropoffLocation: current.pickupLocation }));
    const from = selectedFromRef.current;
    selectedFromRef.current = selectedToRef.current;
    selectedToRef.current = from;
    setRoute(null);
    setSelectedRouteIndex(0);
    setRouteError("");
  }

  function change(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    if (name === "pickupLocation" || name === "dropoffLocation") { setRoute(null); setSelectedRouteIndex(0); setRouteError(""); }
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
      setRoute(null); setSelectedRouteIndex(0); setRouteError("");
    } catch (e) { setError(e.message || "Unable to submit your request. Please try again."); }
    finally { setBusy(false); }
  }


  async function calculateRoute(originValue = form.pickupLocation, destinationValue = form.dropoffLocation, originPlace = selectedFromRef.current, destinationPlace = selectedToRef.current) {
    if (originValue.trim().length < 3 || destinationValue.trim().length < 3) {
      setRouteError("Enter both pickup and destination to calculate the route.");
      return;
    }
    setRouteBusy(true); setRouteError(""); setRoute(null);
    try {
      const response = await fetch(API + "/route-distance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: originValue.trim(), destination: destinationValue.trim(),
          ...(originPlace?.coordinates ? { originCoordinates: originPlace.coordinates, originPlaceName: originPlace.placeName } : {}),
          ...(destinationPlace?.coordinates ? { destinationCoordinates: destinationPlace.coordinates, destinationPlaceName: destinationPlace.placeName } : {})
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to calculate this route.");
      setRoute(data);
      setSelectedRouteIndex(0);
    } catch (e) { setRouteError(e.message || "Unable to calculate the route. Please try again."); }
    finally { setRouteBusy(false); }
  }

  const activeRoute = route ? (route.routes?.[selectedRouteIndex] || route) : null;
  const mapBuildError = !activeRoute?.geometry?.coordinates?.length ? "The route API did not return route geometry." : "";

  const bookingReturnPath = window.location.pathname + window.location.search;
  const loginHref = "/login?returnTo=" + encodeURIComponent(bookingReturnPath);
  const signupHref = "/signup?returnTo=" + encodeURIComponent(bookingReturnPath);

  return <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-roomo-ink"><Header /><main className="flex-1 bg-slate-50 pb-12"><section className="relative overflow-visible bg-[#2563a6] px-4 py-12 text-white sm:px-6 sm:py-16"><div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[36px] border-white/5"></div><div className="absolute -bottom-36 left-[12%] h-72 w-72 rounded-full border-[28px] border-white/5"></div></div><div className="relative mx-auto max-w-7xl"><div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[.18em]">ROOMO Travel · Outstation rides</span><h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">Your journey begins here.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">Find your route, explore the distance and request a comfortable ride to Tiruvannamalai and beyond.</p></div></div></section><div className="relative z-10 mx-auto -mt-6 w-full max-w-7xl px-4 sm:px-6"><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-8"><div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#2563a6]">Plan your journey</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">Where would you like to go?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Enter your route and travel details. Select a place from the suggestions for accurate route calculation.</p></div><a href="/my-bookings" className="text-sm font-semibold text-[#2563a6] hover:underline">My Travel →</a></div>
      {authState === "checking" && <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Checking your ROOMO account…</div>}
      {authState === "signed-out" && <div className="rounded-lg border border-blue-100 bg-blue-50 p-5"><h3 className="font-semibold text-slate-900">Sign in to request a driver</h3><p className="mt-2 text-sm leading-6 text-slate-600">Your trip requests are saved to your account, so you can review pickup details and booking status any time in My Travel.</p><div className="mt-5 flex flex-wrap gap-3"><a href={loginHref} className="inline-flex items-center justify-center rounded-lg bg-[#2563a6] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1e4f85]">Sign in</a><a href={signupHref} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Create an account</a></div></div>}
      {authState === "error" && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Unable to verify your account. Please refresh the page."}<button type="button" className="ml-2 font-semibold underline" onClick={() => window.location.reload()}>Try again</button></div>}
      {authState === "signed-in" && <><div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Requesting as</p><p className="mt-1 font-semibold text-slate-900">{user.fullName}</p><p className="mt-1 text-sm text-slate-600">{user.email}</p>{user.phoneNumber && <p className="mt-1 text-sm text-slate-600">Mobile: {user.phoneNumber}</p>}<a href="/my-bookings" className="mt-2 inline-block text-sm font-semibold text-[#2563a6] hover:underline">View My Travel →</a></div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold text-emerald-900">Your driver request has been received.</p><p className="mt-1 text-sm text-emerald-800">Reference: <strong>{success.bookingCode}</strong> · Status: {success.status}.</p><p className="mt-2 text-sm text-emerald-800">You can track this request from My Travel.</p><a href="/my-bookings" className="mt-3 inline-flex rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">Go to My Travel →</a></div>}
      <form onSubmit={submit} className="grid w-full grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-w-0 space-y-5">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Journey details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PlaceAutocomplete label="From" name="pickupLocation" value={form.pickupLocation} onChange={change} inputRef={null} onSelect={place => { selectedFromRef.current = place; selectedToRef.current = null; }} placeholder="Choose pickup location" />
              <PlaceAutocomplete label="To" name="dropoffLocation" value={form.dropoffLocation} onChange={change} inputRef={destinationInputRef} onSelect={place => { selectedToRef.current = place; calculateRoute(selectedFromRef.current?.placeName || form.pickupLocation, place.placeName, selectedFromRef.current, place); }} placeholder="Choose destination" />
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Travel preferences</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="min-w-0 text-sm font-medium">Date &amp; time<input ref={travelDateInputRef} className={inputClass} name="travelAt" type="datetime-local" required min={new Date(Date.now() + 60000).toISOString().slice(0,16)} value={form.travelAt} onChange={change} /></label>
              <label className="min-w-0 text-sm font-medium">Vehicle<select className={inputClass} name="vehicleType" value={form.vehicleType} onChange={change}><option value="CAR">Car</option><option value="SUV">SUV</option><option value="VAN">Van</option><option value="TEMPO_TRAVELLER">Tempo traveller</option></select></label>
              <label className="min-w-0 text-sm font-medium">Passengers<input className={inputClass} name="passengerCount" type="number" min="1" max="30" required value={form.passengerCount} onChange={change} /></label>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Journey estimate</h3>
            {routeBusy ? <p className="mt-3 text-sm font-medium text-[#2563a6]">Calculating distance and estimated time…</p> : route ? <div className="mt-3 grid grid-cols-2 gap-4">
              <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Distance</p><p className="mt-1 text-2xl font-semibold text-slate-900">{activeRoute.distanceKm} km</p></div>
              <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Estimated time</p><p className="mt-1 text-2xl font-semibold text-slate-900">{activeRoute.durationText}</p></div>
            </div> : <p className="mt-2 text-sm text-slate-500">Choose your From and To locations to see the distance and estimated travel time.</p>}
            {routeError && <p role="alert" className="mt-3 text-sm text-red-600">{routeError}</p>}
            {route && <p className="mt-3 text-xs leading-5 text-slate-500">Estimate based on the selected driving route. Actual travel time may vary with traffic and road conditions.</p>}
          </div>
          <label className="block text-sm font-medium">Mobile number <span className="text-red-600">*</span><input className={inputClass} name="guestPhone" type="tel" inputMode="tel" autoComplete="tel" required minLength={7} maxLength={32} placeholder="Enter your mobile number" value={form.guestPhone} onChange={change} /></label>
          <label className="block text-sm font-medium">Trip notes (optional)<textarea className={inputClass} name="notes" rows="3" maxLength={1000} placeholder="Luggage, additional stops or pickup instructions" value={form.notes} onChange={change} /></label>
          <div>
            <button disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#facc15] px-6 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-yellow-400 focus:outline-none focus:ring-4 focus:ring-yellow-100 disabled:cursor-wait disabled:opacity-60">{busy ? "Sending request…" : "Request a driver"}</button>
            <p className="mt-3 text-xs leading-5 text-slate-500">Submitting this form requests a ride; it does not guarantee a driver until the trip is confirmed.</p>
          </div>
        </div>
        <div className="min-w-0 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Choose your route</h3>
            <p className="mt-1 text-sm text-slate-500">Your route options and driving map will appear here after you select a destination.</p>
          </div>
          {route ? <div className="space-y-3">
            {(route.routes || [route]).map((option, index) => <button key={option.id ?? index} type="button" onClick={() => setSelectedRouteIndex(index)} aria-pressed={selectedRouteIndex === index} className={`w-full rounded-lg border p-4 text-left transition ${selectedRouteIndex === index ? "border-[#2563a6] bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <span className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold text-slate-900">{option.label || "Google driving route"}</span>{index === 0 && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-800">Recommended</span>}</span>
              <span className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1"><span className="text-lg font-semibold text-slate-900">{option.distanceKm} km</span><span className="text-sm text-slate-600">{option.durationText}</span></span>
              <span className={`mt-2 block text-xs font-semibold ${selectedRouteIndex === index ? "text-[#2563a6]" : "text-slate-500"}`}>{selectedRouteIndex === index ? "Selected route" : "Show on map"}</span>
            </button>)}
            {(route.routes || []).length < 2 && <p className="text-xs text-slate-500">Showing the configured driving corridor for this journey.</p>}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3"><h4 className="text-sm font-semibold text-slate-900">Route map</h4><p className="mt-1 text-xs text-slate-500">{activeRoute.label || "Google driving route"} · {route.origin.name} to {route.destination.name}</p></div>
              {mapBuildError ? <div role="alert" className="px-4 py-5 text-sm text-red-700">{mapBuildError}</div> : <GoogleRouteMap route={activeRoute} origin={route.origin.name} destination={route.destination.name} />}
            </div>
          </div> : <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl text-[#2563a6]">⌖</span><p className="mt-4 text-sm font-semibold text-slate-700">{routeBusy ? "Finding your route…" : "Your route map will appear here"}</p><p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">Select a pickup and destination to calculate the distance, estimated time and map.</p></div>
          </div>}
        </div>
      </form></>}
    </section></div></main><Footer /></div>;
}
