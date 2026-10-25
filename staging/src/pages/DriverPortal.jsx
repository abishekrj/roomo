import { useCallback, useEffect, useState } from "react";

const API = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/transport";
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100";
const buttonClass = "inline-flex items-center justify-center rounded-lg bg-[#2563a6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e4f85] disabled:cursor-wait disabled:opacity-50";
function localTime(value) { return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"; }
function decodeVapidKey(value) { const padding = "=".repeat((4 - value.length % 4) % 4); const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(base64), c => c.charCodeAt(0)); }

export default function DriverPortal() {
  const [token, setToken] = useState(() => sessionStorage.getItem("roomo_driver_token") || "");
  const [driver, setDriver] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requests, setRequests] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const vapidKey = import.meta.env.VITE_ROOMO_VAPID_PUBLIC_KEY || "";

  const api = useCallback(async (path, options = {}) => {
    const response = await fetch(API + path, { ...options, headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: "Bearer " + token } : {}), ...(options.headers || {}) }, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Unable to complete this request.");
    return data;
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    const data = await api("/driver/requests");
    setRequests(data.requests || []); setAssigned(data.assigned || []);
  }, [api, token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api("/driver/me").then(data => { if (!cancelled) setDriver(data.driver); }).catch(e => { if (!cancelled) { setError(e.message); sessionStorage.removeItem("roomo_driver_token"); setToken(""); } });
    refresh().catch(e => { if (!cancelled) setError(e.message); });
    const timer = window.setInterval(() => refresh().catch(() => {}), 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [token, api, refresh]);

  async function signIn(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(API + "/driver/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), password }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to sign in.");
      sessionStorage.setItem("roomo_driver_token", data.token); setToken(data.token); setDriver(data.driver); setPassword("");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function enablePush() {
    setError(""); setNotice("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("This browser does not support web push notifications. Try an up-to-date mobile browser.");
      if (!vapidKey) throw new Error("Push notifications are not configured yet. Add VITE_ROOMO_VAPID_PUBLIC_KEY to the staging environment.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notifications are blocked. Allow notifications for ROOMO in your browser settings.");
      const registration = await navigator.serviceWorker.register("/staging/driver-sw.js", { scope: "/staging/" });
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(vapidKey) });
      const data = await api("/driver/push-subscriptions", { method: "POST", body: JSON.stringify({ subscription: subscription.toJSON() }) });
      setPushEnabled(true); setNotice(data.message || "Push notifications are enabled.");
    } catch (e) { setError(e.message || "Unable to enable notifications."); }
  }
  async function respond(offerId, action) {
    setBusy(true); setError(""); setNotice("");
    try { const data = await api("/driver/requests/" + offerId + "/" + action, { method: "POST" }); setNotice(data.message); await refresh(); }
    catch (e) { setError(e.message); await refresh().catch(() => {}); }
    finally { setBusy(false); }
  }
  function signOut() { sessionStorage.removeItem("roomo_driver_token"); setToken(""); setDriver(null); setRequests([]); setAssigned([]); setPushEnabled(false); setNotice(""); setError(""); }

  if (!token || !driver) return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 font-sans text-roomo-ink"><section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><a href="/staging" className="text-sm font-semibold tracking-wide text-[#2563a6]">ROOMO</a><p className="mt-6 text-xs font-semibold uppercase tracking-[.16em] text-[#2563a6]">Driver portal</p><h1 className="mt-2 text-2xl font-semibold">Welcome back, driver</h1><p className="mt-2 text-sm leading-6 text-slate-500">Sign in to receive trip requests and manage your assigned journeys.</p>{error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<form onSubmit={signIn} className="mt-6 space-y-4"><label className="block text-sm font-medium">Email address<input className={inputClass} type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label><label className="block text-sm font-medium">Password<input className={inputClass} type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><button className={buttonClass + " w-full"} disabled={busy}>{busy ? "Signing in…" : "Sign in to Driver Portal"}</button></form><p className="mt-5 text-xs leading-5 text-slate-500">Driver accounts are created by the ROOMO Super Admin.</p></section></main>;

  return <div className="min-h-screen bg-slate-50 font-sans text-roomo-ink"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6"><div><a href="/staging" className="text-lg font-semibold tracking-tight text-[#2563a6]">ROOMO</a><p className="mt-0.5 text-xs text-slate-500">Driver portal</p></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{driver.fullName}</p><p className="text-xs text-slate-500">{driver.vehicleNumber || driver.vehicleType}</p></div><button onClick={signOut} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sign out</button></div></div></header>
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8"><section className="rounded-lg bg-[#102747] p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-7"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-200">Your trips at a glance</p><h1 className="mt-2 text-2xl font-semibold">Ready for your next journey?</h1><p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">Keep this portal available and enable push notifications so you can respond to new trip requests promptly.</p></div><button onClick={enablePush} className="mt-5 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#102747] transition hover:bg-blue-50 sm:mt-0">{pushEnabled ? "✓ Notifications enabled" : "♧ Enable notifications"}</button></section>
      {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}{error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">New requests</p><p className="mt-2 text-3xl font-semibold">{requests.length}</p></div><div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Upcoming trips</p><p className="mt-2 text-3xl font-semibold">{assigned.length}</p></div><div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Notification status</p><p className="mt-2 text-base font-semibold">{pushEnabled ? "Enabled on this device" : "Not enabled"}</p></div></div>
      <section className="mt-8"><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">New trip requests</h2><p className="mt-1 text-sm text-slate-500">Requests expire after the response window closes.</p></div><button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50" onClick={() => refresh().catch(e => setError(e.message))}>Refresh</button></div>
        {requests.length ? <div className="grid gap-4 lg:grid-cols-2">{requests.map(item => <article key={item.offerId} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563a6]">{item.booking.bookingCode}</span><h3 className="mt-3 text-lg font-semibold">{item.booking.pickupLocation}</h3><p className="mt-1 text-sm text-slate-500">to {item.booking.dropoffLocation}</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Awaiting response</span></div><div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm"><div><p className="text-xs text-slate-500">Pickup time</p><p className="mt-1 font-medium">{localTime(item.booking.travelAt)}</p></div><div><p className="text-xs text-slate-500">Passengers / vehicle</p><p className="mt-1 font-medium">{item.booking.passengerCount} · {item.booking.vehicleType.replaceAll("_", " ")}</p></div><div><p className="text-xs text-slate-500">Contact name</p><p className="mt-1 font-medium">{item.booking.guestName}</p></div><div><p className="text-xs text-slate-500">Contact phone</p><p className="mt-1 font-medium">{item.booking.guestPhone}</p></div></div>{item.booking.notes && <p className="mt-3 text-sm text-slate-600">Notes: {item.booking.notes}</p>}<p className="mt-3 text-xs text-slate-500">Respond by {localTime(item.expiresAt)}</p><div className="mt-4 flex gap-2"><button disabled={busy} className={buttonClass + " flex-1"} onClick={() => respond(item.offerId, "accept")}>Accept trip</button><button disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" onClick={() => respond(item.offerId, "decline")}>Decline</button></div></article>)}</div> : <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><p className="font-semibold">No new requests right now</p><p className="mt-1 text-sm text-slate-500">We’ll show matching trips here when they become available.</p></div>}
      </section>
      <section className="mt-8"><h2 className="text-xl font-semibold">Confirmed trips</h2><p className="mt-1 text-sm text-slate-500">Trips assigned to you.</p><div className="mt-4 grid gap-3">{assigned.length ? assigned.map(booking => <article key={booking.id} className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{booking.bookingCode}</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{booking.status.replaceAll("_", " ")}</span></div><p className="mt-3 font-medium">{booking.pickupLocation} <span className="text-slate-400">→</span> {booking.dropoffLocation}</p><p className="mt-2 text-sm text-slate-500">{localTime(booking.travelAt)} · {booking.passengerCount} passengers · {booking.vehicleType.replaceAll("_", " ")}</p><p className="mt-2 text-sm">Contact: {booking.guestName} · {booking.guestPhone}</p></article>) : <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No confirmed trips assigned yet.</p>}</div></section>
    </main></div>;
}
