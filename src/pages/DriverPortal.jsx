import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const API = (import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api") + "/transport";
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563a6] focus:ring-2 focus:ring-blue-100";
const buttonClass = "inline-flex items-center justify-center rounded-lg bg-[#2563a6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e4f85] disabled:cursor-wait disabled:opacity-50";
const secondaryButton = "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";
function localTime(value) { return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"; }
function decodeVapidKey(value) { const padding = "=".repeat((4 - value.length % 4) % 4); const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(base64), c => c.charCodeAt(0)); }
function statusPill(status) {
  if (status === "COMPLETED") return "bg-slate-100 text-slate-700";
  if (status === "IN_PROGRESS") return "bg-blue-50 text-blue-800";
  if (status === "CANCELLED") return "bg-red-50 text-red-700";
  return "bg-emerald-50 text-emerald-800";
}

export default function DriverPortal() {
  const [token, setToken] = useState(() => sessionStorage.getItem("roomo_driver_token") || "");
  const [driver, setDriver] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/driver/login";
  const signupMode = currentPath === "/driver/signup";
  const dashboardPath = "/driver/dashboard";
  const driverPagePaths = [dashboardPath, "/driver/new-trip-requests", "/driver/completed-trips", "/driver/current-trip"];

  useEffect(() => {
    if (currentPath === "/driver") {
      window.location.replace(token ? dashboardPath : "/driver/login");
      return;
    }
    if (!token && driverPagePaths.includes(currentPath)) {
      window.location.replace("/driver/login");
      return;
    }
    if (token && !driverPagePaths.includes(currentPath)) {
      window.location.replace(dashboardPath);
    }
  }, [currentPath, token]);
  const [requests, setRequests] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const pageByPath = { "/driver/dashboard": "dashboard", "/driver/new-trip-requests": "new-requests", "/driver/completed-trips": "completed-trips", "/driver/current-trip": "current-trip" };
  const activePage = pageByPath[currentPath] || "dashboard";
  function navigateToPage(pageId) {
    const pagePaths = { dashboard: "/driver/dashboard", "new-requests": "/driver/new-trip-requests", "completed-trips": "/driver/completed-trips", "current-trip": "/driver/current-trip" };
    window.location.href = pagePaths[pageId] || "/driver/dashboard";
  }
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
    setRequests(data.requests || []);
    setAssigned(data.assigned || []);
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
      sessionStorage.setItem("roomo_driver_token", data.token); setToken(data.token); setDriver(data.driver); setPassword(""); window.location.replace("/driver/dashboard");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function enablePush() {
    setError(""); setNotice("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("This browser does not support web push notifications. Try an up-to-date mobile browser.");
      if (!vapidKey) throw new Error("Push notifications are not configured yet. Add VITE_ROOMO_VAPID_PUBLIC_KEY to the deployment environment.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notifications are blocked. Allow notifications for ROOMO in your browser settings.");
      const registration = await navigator.serviceWorker.register("/driver-sw.js", { scope: "/" });
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
  function signOut() { sessionStorage.removeItem("roomo_driver_token"); setToken(""); setDriver(null); setRequests([]); setAssigned([]); setPushEnabled(false); setNotice(""); setError(""); setActivePage("dashboard"); window.location.replace("/driver/login"); }

  const currentTrips = useMemo(() => assigned.filter(item => ["CONFIRMED", "IN_PROGRESS"].includes(item.status)), [assigned]);
  const completedTrips = useMemo(() => assigned.filter(item => item.status === "COMPLETED"), [assigned]);
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "my-trips", label: "My Trips", icon: "⌁", children: [
      { id: "new-requests", label: "New Trip Request", count: requests.length },
      { id: "completed-trips", label: "Completed Trips", count: completedTrips.length },
      { id: "current-trip", label: "Current Trip", count: currentTrips.length }
    ] }
  ];

  if (token && !driver) return <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans text-roomo-ink"><div className="rounded-lg border border-slate-200 bg-white px-6 py-5 text-center shadow-sm"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2563a6]" role="status" aria-label="Loading driver portal" /><p className="mt-3 text-sm font-medium text-slate-600">Loading your driver workspace…</p></div></div>;

  if (!token || !driver) return <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-roomo-ink"><Header /><main className="flex flex-1 items-center justify-center px-4 py-10"><section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#2563a6]">Driver portal</p><h1 className="mt-2 text-2xl font-semibold">{signupMode ? "Driver registration" : "Welcome back, driver"}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{signupMode ? "Driver accounts are created by the ROOMO Super Admin. Contact the administrator to register and receive your login details." : "Sign in to receive trip requests and manage your assigned journeys."}</p>{error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{!signupMode && <form onSubmit={signIn} className="mt-6 space-y-4"><label className="block text-sm font-medium">Email address<input className={inputClass} type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label><label className="block text-sm font-medium">Password<input className={inputClass} type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><button className={buttonClass + " w-full"} disabled={busy}>{busy ? "Signing in…" : "Sign in to Driver Portal"}</button></form>}<p className="mt-5 text-center text-sm text-slate-600">{signupMode ? "Already registered as a driver?" : "New driver joining ROOMO?"} <a href={signupMode ? "/driver/login" : "/driver/signup"} className="font-semibold text-[#2563a6] hover:underline">{signupMode ? "Sign in" : "Driver signup information"}</a></p></section></main><Footer /></div>;

  function TripCard({ item, requestCard = false }) {
    const booking = requestCard ? item.booking : item;
    return <article key={requestCard ? item.offerId : item.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563a6]">{booking.bookingCode}</span><h3 className="mt-3 text-lg font-semibold">{booking.pickupLocation}</h3><p className="mt-1 text-sm text-slate-500">to {booking.dropoffLocation}</p></div><span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (requestCard ? "bg-amber-50 text-amber-800" : statusPill(booking.status))}>{requestCard ? "Awaiting response" : booking.status.replaceAll("_", " ")}</span></div>
      <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2"><div><p className="text-xs text-slate-500">Pickup time</p><p className="mt-1 font-medium">{localTime(booking.travelAt)}</p></div><div><p className="text-xs text-slate-500">Passengers / vehicle</p><p className="mt-1 font-medium">{booking.passengerCount} · {booking.vehicleType.replaceAll("_", " ")}</p></div><div><p className="text-xs text-slate-500">Contact name</p><p className="mt-1 font-medium">{booking.guestName}</p></div><div><p className="text-xs text-slate-500">Contact phone</p><p className="mt-1 font-medium">{booking.guestPhone}</p></div></div>
      {booking.notes && <p className="mt-3 text-sm text-slate-600">Notes: {booking.notes}</p>}
      {requestCard && <><p className="mt-3 text-xs text-slate-500">Respond by {localTime(item.expiresAt)}</p><div className="mt-4 flex flex-wrap gap-2"><button disabled={busy} className={buttonClass + " flex-1"} onClick={() => respond(item.offerId, "accept")}>Accept trip</button><button disabled={busy} className={secondaryButton} onClick={() => respond(item.offerId, "decline")}>Decline</button></div></>}
    </article>;
  }

  const pageHeading = activePage === "dashboard" ? "Dashboard" : activePage === "new-requests" ? "New Trip Request" : activePage === "completed-trips" ? "Completed Trips" : "Current Trip";

  return <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-roomo-ink">
    <header className="border-b border-slate-200 bg-white"><div className="flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"><div><a href="/" className="text-lg font-semibold tracking-tight text-[#2563a6]">ROOMO</a><p className="mt-0.5 text-xs text-slate-500">Driver workspace</p></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{driver.fullName}</p><p className="text-xs text-slate-500">{driver.vehicleNumber || driver.vehicleType}</p></div><button onClick={signOut} className={secondaryButton}>Sign out</button></div></div></header>
    <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="grid w-full gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-lg bg-[#102747] p-4 text-white lg:sticky lg:top-4">
          <div className="px-3 pb-5 pt-2"><p className="text-xl font-semibold tracking-tight">ROOMO</p><p className="mt-1 text-[10px] font-semibold tracking-[.18em] text-blue-200">DRIVER PORTAL</p></div>
          <p className="px-3 pb-3 text-[10px] font-semibold tracking-[.16em] text-slate-400">WORKSPACE</p>
          <nav className="space-y-1" aria-label="Driver navigation">
            {navItems.map(item => item.children ? <details key={item.id} className="group rounded-lg" open={activePage !== "dashboard" ? true : undefined}><summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"><span className="w-5 text-center text-lg" aria-hidden="true">{item.icon}</span><span className="flex-1">{item.label}</span><span className="text-xs transition group-open:rotate-180" aria-hidden="true">⌄</span></summary><div className="ml-5 space-y-1 border-l border-white/15 py-1 pl-3">{item.children.map(child => <button key={child.id} type="button" onClick={() => { navigateToPage(child.id); setError(""); setNotice(""); }} className={activePage === child.id ? "flex w-full items-center gap-2 rounded-md bg-[#2563a6] px-3 py-2.5 text-left text-xs font-semibold leading-5 text-white" : "flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs leading-5 text-slate-300 transition hover:bg-white/10 hover:text-white"}><span className="flex-1">{child.label}</span><span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{child.count}</span></button>)}</div></details> : <button key={item.id} type="button" onClick={() => { navigateToPage(item.id); setError(""); setNotice(""); }} aria-current={activePage === item.id ? "page" : undefined} className={activePage === item.id ? "flex w-full items-center gap-3 rounded-lg bg-[#2563a6] px-3 py-3 text-left text-sm font-medium text-white shadow-sm" : "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"}><span className="w-5 text-center text-lg" aria-hidden="true">{item.icon}</span>{item.label}</button>)}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-4"><p className="px-3 text-xs text-slate-300">Your driver account</p><button onClick={signOut} className="mt-3 w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Sign out</button></div>
        </aside>
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#2563a6]">Driver workspace</p><h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{pageHeading}</h1><p className="mt-2 text-sm text-slate-500">{activePage === "dashboard" ? "Your trips, requests and notifications in one place." : activePage === "new-requests" ? "Review and respond to new trip requests." : activePage === "completed-trips" ? "A record of the trips you have completed." : "Trips currently assigned to you."}</p></div><button onClick={() => refresh().catch(e => setError(e.message))} className={secondaryButton}>↻ Refresh</button></div>
          {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
          {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {activePage === "dashboard" && <>
            <section className="rounded-lg bg-[#102747] p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-7"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-200">Your trips at a glance</p><h2 className="mt-2 text-2xl font-semibold">Ready for your next journey?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">Keep this portal available and enable push notifications so you can respond to new trip requests promptly.</p></div><button onClick={enablePush} className="mt-5 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#102747] transition hover:bg-blue-50 sm:mt-0">{pushEnabled ? "✓ Notifications enabled" : "♧ Enable notifications"}</button></section>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><button onClick={() => navigateToPage("new-requests")} className="rounded-lg border border-slate-200 bg-white p-5 text-left hover:border-blue-300"><p className="text-sm text-slate-500">New trip requests</p><p className="mt-2 text-3xl font-semibold">{requests.length}</p><p className="mt-2 text-sm font-semibold text-[#2563a6]">Review requests →</p></button><button onClick={() => navigateToPage("current-trip")} className="rounded-lg border border-slate-200 bg-white p-5 text-left hover:border-blue-300"><p className="text-sm text-slate-500">Current trips</p><p className="mt-2 text-3xl font-semibold">{currentTrips.length}</p><p className="mt-2 text-sm font-semibold text-[#2563a6]">View current trips →</p></button><button onClick={() => navigateToPage("completed-trips")} className="rounded-lg border border-slate-200 bg-white p-5 text-left hover:border-blue-300"><p className="text-sm text-slate-500">Completed trips</p><p className="mt-2 text-3xl font-semibold">{completedTrips.length}</p><p className="mt-2 text-sm font-semibold text-[#2563a6]">View history →</p></button><div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Notification status</p><p className="mt-2 text-lg font-semibold">{pushEnabled ? "Enabled" : "Not enabled"}</p><p className="mt-2 text-sm text-slate-500">For this device</p></div></div>
            <section className="mt-7"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">New trip requests</h2><p className="mt-1 text-sm text-slate-500">Requests expire after the response window closes.</p></div><button onClick={() => setActivePage("new-requests")} className="text-sm font-semibold text-[#2563a6]">View all →</button></div>{requests.length ? <div className="grid gap-4 xl:grid-cols-2">{requests.slice(0, 2).map(item => <TripCard key={item.offerId} item={item} requestCard />)}</div> : <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No new requests right now.</p>}</section>
          </>}
          {activePage === "new-requests" && <section>{requests.length ? <div className="grid gap-4 xl:grid-cols-2">{requests.map(item => <TripCard key={item.offerId} item={item} requestCard />)}</div> : <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><h2 className="font-semibold">No new requests right now</h2><p className="mt-1 text-sm text-slate-500">We’ll show matching trips here when they become available.</p></div>}</section>}
          {activePage === "current-trip" && <section>{currentTrips.length ? <div className="grid gap-4 xl:grid-cols-2">{currentTrips.map(item => <TripCard key={item.id} item={item} />)}</div> : <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><h2 className="font-semibold">No current trips</h2><p className="mt-1 text-sm text-slate-500">Accepted and in-progress trips assigned to you will appear here.</p></div>}</section>}
          {activePage === "completed-trips" && <section>{completedTrips.length ? <div className="grid gap-4 xl:grid-cols-2">{completedTrips.map(item => <TripCard key={item.id} item={item} />)}</div> : <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><h2 className="font-semibold">No completed trips yet</h2><p className="mt-1 text-sm text-slate-500">Completed journeys will be listed here.</p></div>}</section>}
        </div>
      </div>
    </main>
    <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:px-6">© {new Date().getFullYear()} ROOMO. All rights reserved.</footer>
  </div>;
}
