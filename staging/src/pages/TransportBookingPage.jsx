import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const API = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/transport";
const AUTH_API = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100";
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

  function change(event) { setForm(current => ({ ...current, [event.target.name]: event.target.value })); }

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
    } catch (e) { setError(e.message || "Unable to submit your request. Please try again."); }
    finally { setBusy(false); }
  }

  const bookingReturnPath = window.location.pathname + window.location.search;
  const loginHref = "/staging/login?returnTo=" + encodeURIComponent(bookingReturnPath);
  const signupHref = "/staging/signup?returnTo=" + encodeURIComponent(bookingReturnPath);

  return <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-roomo-ink"><Header /><main className="flex-1 py-8 sm:py-12"><div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
    <section className="rounded-lg bg-[#102747] p-6 text-white sm:p-8 lg:sticky lg:top-6"><span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-100">ROOMO Travel</span><h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">Outstation journeys to Tiruvannamalai, made simpler.</h1><p className="mt-4 text-sm leading-7 text-blue-100">Request a car or van between Tiruvannamalai and cities such as Chennai, Bengaluru, Vellore, Madurai, Coimbatore, Pondicherry and Villupuram. Enter your pickup, destination and travel time; eligible drivers are notified and the first driver to accept is assigned to your trip.</p><div className="mt-8 space-y-4 text-sm"><p className="flex gap-3"><span className="text-emerald-300">✓</span> Request an outstation ride in a few steps</p><p className="flex gap-3"><span className="text-emerald-300">✓</span> Driver assignment handled by ROOMO</p><p className="flex gap-3"><span className="text-emerald-300">✓</span> Track requests in My Travel after signing in</p></div></section>
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#2563a6]">Plan your journey</p><h2 className="mt-2 text-2xl font-semibold">Request a car or van</h2><p className="mt-2 text-sm leading-6 text-slate-500">Sign in to submit a trip request and track the driver response under My Travel. When you choose a city from Famous Places Nearby, its destination is filled in automatically.</p></div>
      {authState === "checking" && <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Checking your ROOMO account…</div>}
      {authState === "signed-out" && <div className="rounded-lg border border-blue-100 bg-blue-50 p-5"><h3 className="font-semibold text-slate-900">Sign in to request a driver</h3><p className="mt-2 text-sm leading-6 text-slate-600">Your trip requests are saved to your account, so you can review pickup details and booking status any time in My Travel.</p><div className="mt-5 flex flex-wrap gap-3"><a href={loginHref} className="inline-flex items-center justify-center rounded-lg bg-[#2563a6] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1e4f85]">Sign in</a><a href={signupHref} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Create an account</a></div></div>}
      {authState === "error" && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Unable to verify your account. Please refresh the page."}<button type="button" className="ml-2 font-semibold underline" onClick={() => window.location.reload()}>Try again</button></div>}
      {authState === "signed-in" && <><div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Requesting as</p><p className="mt-1 font-semibold text-slate-900">{user.fullName}</p><p className="mt-1 text-sm text-slate-600">{user.email}</p><a href="/staging/my-bookings" className="mt-2 inline-block text-sm font-semibold text-[#2563a6] hover:underline">View My Travel →</a></div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold text-emerald-900">Your driver request has been received.</p><p className="mt-1 text-sm text-emerald-800">Reference: <strong>{success.bookingCode}</strong> · Status: {success.status}.</p><p className="mt-2 text-sm text-emerald-800">You can track this request from My Travel.</p><a href="/staging/my-bookings" className="mt-3 inline-flex rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">Go to My Travel →</a></div>}
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">Mobile number<input className={inputClass} name="guestPhone" autoComplete="tel" type="tel" required minLength={7} maxLength={32} value={form.guestPhone} onChange={change} placeholder="Enter a contact number for this trip" /></label>
        <label className="text-sm font-medium sm:col-span-2">Pickup location<input className={inputClass} name="pickupLocation" required minLength={3} maxLength={500} placeholder="Hotel, ashram, railway station or address" value={form.pickupLocation} onChange={change} /></label>
        <label className="text-sm font-medium sm:col-span-2">Destination<input className={inputClass} name="dropoffLocation" required minLength={3} maxLength={500} placeholder="Where would you like to go?" value={form.dropoffLocation} onChange={change} /><span className="mt-1 block text-xs font-normal text-slate-500">You can change this destination or add extra stop details in Trip notes.</span></label>
        <label className="text-sm font-medium">Pickup date & time<input className={inputClass} name="travelAt" type="datetime-local" required min={new Date(Date.now() + 60000).toISOString().slice(0,16)} value={form.travelAt} onChange={change} /></label>
        <label className="text-sm font-medium">Vehicle type<select className={inputClass} name="vehicleType" value={form.vehicleType} onChange={change}><option value="CAR">Car</option><option value="SUV">SUV</option><option value="VAN">Van</option><option value="TEMPO_TRAVELLER">Tempo traveller</option></select></label>
        <label className="text-sm font-medium">Passengers<input className={inputClass} name="passengerCount" type="number" min="1" max="30" required value={form.passengerCount} onChange={change} /></label>
        <label className="text-sm font-medium sm:col-span-2">Trip notes (optional)<textarea className={inputClass} name="notes" rows="3" maxLength={1000} placeholder="Luggage, additional stops or pickup instructions" value={form.notes} onChange={change} /></label>
        <div className="sm:col-span-2"><button disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#2563a6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1e4f85] disabled:cursor-wait disabled:opacity-60 sm:w-auto">{busy ? "Sending request…" : "Request a driver →"}</button><p className="mt-3 text-xs leading-5 text-slate-500">Submitting this form requests a ride; it does not guarantee a driver until the trip is confirmed.</p></div>
      </form></>}
    </section>
  </div></main><Footer /></div>;
}
