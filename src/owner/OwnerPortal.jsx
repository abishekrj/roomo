import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import OwnerPropertyManager from "./OwnerPropertyManager.jsx";

const API = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";
function csrfHeaders() { const item = document.cookie.split("; ").find(part => part.startsWith("roomo_csrf=")); return item ? { "X-CSRF-Token": decodeURIComponent(item.slice("roomo_csrf=".length)) } : {}; }
const menu = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "properties", label: "My Properties", icon: "⌂" },
  { id: "enquiries", label: "Enquiries", icon: "✉" },
  { id: "reports", label: "Reports", icon: "▤" },
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function dateRange(item) {
  return item.checkIn || item.checkOut ? `${formatDate(item.checkIn)} – ${formatDate(item.checkOut)}` : "Dates not selected";
}

export default function OwnerPortal() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [signupMode, setSignupMode] = useState(() => /\/(signup|register)$/.test(window.location.pathname.replace(/\/+$/, "")));
  const [password, setPassword] = useState("");
  const [owner, setOwner] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [properties, setProperties] = useState([]);
  const [reservations, setReservations] = useState([]);
  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/owner";
  const routePrefix = currentPath.startsWith("/staging/owner") ? "/staging/owner" : "/owner";
  const routePage = currentPath.endsWith("/properties") ? "properties" : currentPath.endsWith("/enquiries") ? "enquiries" : currentPath.endsWith("/reports") ? "reports" : "dashboard";
  const [active, setActive] = useState(routePage);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  const request = useCallback(async (path, authToken = token) => {
    const response = await fetch(API + path, { headers: csrfHeaders(), credentials: "include", cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        setToken(""); setOwner(null);
      }
      throw new Error(data.message || "Unable to load owner dashboard data. Please try again.");
    }
    return data;
  }, [token]);

  const loadDashboard = useCallback(async (authToken = token) => {
    if (!authToken) return;
    setBusy(true); setMessage("");
    try {
      const [p, e, r] = await Promise.all([
        request("/properties/owner", authToken),
        request("/enquiries/owner", authToken),
        request("/reservations/owner", authToken).catch(() => ({ reservations: [] })),
      ]);
      setProperties(Array.isArray(p.properties) ? p.properties : []);
      setEnquiries(Array.isArray(e.enquiries) ? e.enquiries : []);
      setReservations(Array.isArray(r.reservations) ? r.reservations : []);
    } catch (error) {
      setMessage(error.message || "Unable to load owner dashboard data.");
    } finally { setBusy(false); }
  }, [request, token]);

  useEffect(() => {
    let cancelled = false;
    fetch(API + "/auth/me", { credentials: "include", cache: "no-store" })
      .then(async response => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || "No active owner session."); return data; })
      .then(data => { if (cancelled || !data.owner || data.owner.role !== "OWNER") return; setOwner(data.owner); setToken("cookie-session"); loadDashboard("cookie-session"); })
      .catch(() => { if (!cancelled) { setOwner(null); setToken(""); } });
    return () => { cancelled = true; };
  }, []); // Restore the owner session from the HttpOnly cookie.

  async function signUp(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(API + "/auth/register", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim().toLowerCase(), phoneNumber: phoneNumber.trim(), password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to create your owner account.");
      setSignupMode(false); setPassword(""); setMessage(data.message || "Owner account created successfully. You can now sign in.");
      window.history.replaceState({}, "", routePrefix + "/login");
    } catch (error) { setMessage(error.message || "Unable to create your owner account."); }
    finally { setBusy(false); }
  }

  async function signIn(event) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const response = await fetch(API + "/auth/login", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to sign in.");
      if (data.owner?.role !== "OWNER") throw new Error("This login is for property owner accounts.");
      setToken("cookie-session"); setOwner(data.owner);
      await loadDashboard("cookie-session");
      window.location.href = routePrefix + "/dashboard";
    } catch (error) { setMessage(error.message || "Unable to sign in."); }
    finally { setBusy(false); }
  }

  async function signOut() {
    try { await fetch(API + "/auth/logout", { method: "POST", credentials: "include", headers: csrfHeaders() }); }
    finally { setToken(""); setOwner(null); setEnquiries([]); setProperties([]); setReservations([]); setPassword(""); setMessage(""); window.location.href = routePrefix + "/login"; }
  }

  const filteredEnquiries = useMemo(() => enquiries.filter((item) =>
    [item.property?.title, item.guestName, item.email, item.phone, item.message, item.status, item.property?.city]
      .some((value) => String(value || "").toLowerCase().includes(query.toLowerCase()))
  ), [enquiries, query]);

  const pendingCount = enquiries.filter((item) => ["NEW", "PENDING", "REQUESTED"].includes(String(item.status || "NEW").toUpperCase())).length;
  const approvedCount = enquiries.filter((item) => ["APPROVED", "CONFIRMED"].includes(String(item.status || "").toUpperCase())).length;
  const availableRooms = properties.reduce((sum, property) => {
    const available = property.availabilityCount;
    return sum + (available !== null && available !== undefined ? Math.max(0, Number(available) || 0) : Math.max(0, Number(property.totalUnits) || 0));
  }, 0);

  const stats = [
    { label: "Total Enquiries", value: enquiries.length, icon: "✉", hint: "All guest enquiries", tint: "bg-blue-50 text-blue-700" },
    { label: "Pending Enquiries", value: pendingCount, icon: "◷", hint: "Awaiting your review", tint: "bg-amber-50 text-amber-700" },
    { label: "Approved Enquiries", value: approvedCount, icon: "✓", hint: "Approved by your team", tint: "bg-emerald-50 text-emerald-700" },
    { label: "Available Rooms", value: availableRooms, icon: "⌂", hint: "Across your properties", tint: "bg-violet-50 text-violet-700" },
  ];

  return <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-roomo-ink">
    <Header ownerPortal={!signupMode} />
    {!token || !owner ? <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">ROOMO Partner Portal</p>
        <h1 className="mt-2 text-2xl font-semibold">{signupMode ? "Register as a property owner" : "Owner login"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{signupMode ? "Create your free owner account, add your property, and submit it to ROOMO for review." : "Sign in to manage your property enquiries and view your dashboard."}</p>
        <form onSubmit={signupMode ? signUp : signIn} className="mt-6 space-y-4">
          {signupMode && <label className="block text-sm font-medium">Full name<input required minLength={2} autoComplete="name" value={fullName} onChange={event => setFullName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>}
          <label className="block text-sm font-medium">Email address<input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
          {signupMode && <label className="block text-sm font-medium">Mobile number <span className="text-red-600">*</span><input required type="tel" autoComplete="tel" inputMode="tel" pattern="\\+[1-9][0-9]{7,14}" title="Enter your mobile number with country code, for example +919876543210" placeholder="+919876543210" value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /><span className="mt-1 block text-xs font-normal text-slate-500">Include your country code (e.g. +91).</span></label>}
          <label className="block text-sm font-medium">Password<input required type="password" autoComplete={signupMode ? "new-password" : "current-password"} minLength={signupMode ? 12 : 1} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
          {message && <p role="status" className={`rounded-lg p-3 text-sm ${/successfully|created/i.test(message) ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{message}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-[#feba02] px-4 py-3 font-semibold text-[#212529] transition hover:bg-[#e5a900] disabled:opacity-60">{busy ? (signupMode ? "Creating account…" : "Signing in…") : signupMode ? "Create owner account" : "Sign in"}</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">{signupMode ? "Already have an owner account?" : "Want to list your property on ROOMO?"} <a href={routePrefix + (signupMode ? "/login" : "/signup")} onClick={event => { event.preventDefault(); setSignupMode(!signupMode); setMessage(""); setPassword(""); window.history.pushState({}, "", routePrefix + (signupMode ? "/login" : "/signup")); }} className="font-semibold text-blue-700 hover:underline">{signupMode ? "Sign in" : "Register as a property owner"}</a></p>
      </div>
    </main> : <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-lg border border-slate-200 bg-[#102747] p-4 text-white lg:sticky lg:top-5">
          <div className="px-3 pb-5 pt-2"><p className="text-xl font-semibold tracking-tight">ROOMO</p><p className="mt-1 text-[10px] font-semibold tracking-[.18em] text-blue-200">OWNER PANEL</p></div>
          <p className="px-3 pb-3 text-[10px] font-semibold tracking-[.16em] text-slate-400">WORKSPACE</p>
          <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1" aria-label="Owner dashboard navigation">
            {menu.map((item) => <a key={item.id} href={`${routePrefix}/${item.id}`} onClick={() => setQuery("")} aria-current={active === item.id ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${active === item.id ? "bg-[#2563a6] text-white shadow-sm" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}><span className="w-5 text-center text-lg" aria-hidden="true">{item.icon}</span>{item.label}</a>)}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-4"><p className="truncate px-3 text-xs text-slate-300">{owner.email}</p><button onClick={signOut} className="mt-3 w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Sign out</button></div>
        </aside>
        <section className="min-w-0">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><p className="text-xs font-semibold uppercase tracking-widest text-blue-700">ROOMO Partner Portal</p><h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{({dashboard:"Owner Dashboard",properties:"My Properties",enquiries:"Enquiries",reports:"Reports"})[active] || "Owner Dashboard"}</h1><p className="mt-1 text-sm text-slate-500">Welcome back, {owner.fullName}.</p></div>
            <button onClick={() => loadDashboard()} disabled={busy} className="self-start rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60">{busy ? "Refreshing…" : "↻ Refresh data"}</button>
          </div>
          {message && <div role="alert" className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span>{message}</span><button onClick={() => loadDashboard()} className="shrink-0 font-semibold underline">Retry</button></div>}
          {active === "dashboard" && <>
            <div className="mb-5"><h2 className="text-xl font-semibold">Dashboard overview</h2><p className="mt-1 text-sm text-slate-500">A quick view of enquiries and room availability across your properties.</p></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{stat.label}</p><p className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">{stat.value}</p></div><span className={`grid h-11 w-11 place-items-center rounded-lg text-xl ${stat.tint}`}>{stat.icon}</span></div><p className="mt-3 text-xs text-slate-500">{stat.hint}</p></article>)}</div>
            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Recent enquiries</h3><p className="mt-1 text-sm text-slate-500">Latest guest requests for your properties.</p></div><a href={`${routePrefix}/enquiries`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">View all →</a></div>
              {enquiries.length ? <div className="mt-4 divide-y divide-slate-100">{enquiries.slice(0, 5).map((item) => <div key={item.id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.guestName} <span className="font-normal text-slate-500">· {item.property?.title || "Property"}</span></p><p className="mt-1 text-xs text-slate-500">{dateRange(item)} · {item.adults} adults · {item.rooms} room(s)</p></div><span className="w-fit rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.status || "NEW"}</span></div>)}</div> : <p className="py-8 text-center text-sm text-slate-500">{busy ? "Loading enquiries…" : "No enquiries have been received yet."}</p>}
            </div>
          </>}
          {active === "properties" && <OwnerPropertyManager properties={properties} canEditProperties={Boolean(owner?.canEditProperties)} onRefresh={() => loadDashboard()} />}
          {active === "enquiries" && <div className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-200 p-5"><h2 className="text-xl font-semibold">Enquiries</h2><p className="mt-1 text-sm text-slate-500">Guest enquiries submitted for your properties. These are not confirmed bookings.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input aria-label="Search enquiries" placeholder="Search guest, property, email or message…" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600" /><span className="self-center text-xs text-slate-500">{filteredEnquiries.length} result(s)</span></div></div>
            {filteredEnquiries.length ? <div className="divide-y divide-slate-200">{filteredEnquiries.map((item) => <article key={item.id} className="p-5"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><h3 className="font-semibold">{item.property?.title || "Property enquiry"}</h3><p className="text-sm text-slate-500">{[item.property?.address, item.property?.city].filter(Boolean).join(", ")}</p></div><span className="h-fit w-fit rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{item.status || "NEW"}</span></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3"><p><span className="block text-slate-500">Guest</span><strong>{item.guestName}</strong></p><p><span className="block text-slate-500">Email</span><a className="font-medium text-blue-700 hover:underline" href={"mailto:" + item.email}>{item.email}</a></p><p><span className="block text-slate-500">Phone</span><a className="font-medium text-blue-700 hover:underline" href={"tel:" + item.phone}>{item.phone}</a></p><p><span className="block text-slate-500">Check-in</span><strong>{formatDate(item.checkIn)}</strong></p><p><span className="block text-slate-500">Check-out</span><strong>{formatDate(item.checkOut)}</strong></p><p><span className="block text-slate-500">Guests / Rooms</span><strong>{item.adults} adults · {item.rooms} room(s)</strong></p></div>{item.message && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm"><span className="mb-1 block font-semibold">Guest message</span>{item.message}</p>}<p className="mt-3 text-xs text-slate-500">Received {formatDate(item.createdAt)}</p></article>)}</div> : <p className="p-10 text-center text-sm text-slate-500">{busy ? "Loading enquiries…" : query ? "No enquiries match your search." : "No enquiries found."}</p>}</div>}
          {active === "reports" && <div className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-xl font-semibold">Reports</h2><p className="mt-1 text-sm text-slate-500">Summary of enquiry activity and room inventory.</p><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <div key={stat.label} className="rounded-lg border border-slate-200 p-4"><p className="text-sm text-slate-500">{stat.label}</p><p className="mt-2 text-2xl font-semibold">{stat.value}</p></div>)}</div><div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Reservations in system: <strong>{reservations.length}</strong></div></div>}
        </section>
      </div>
    </main>}
    {!token || !owner ? <Footer /> : <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:px-6">© {new Date().getFullYear()} ROOMO. All rights reserved.</footer>}
  </div>;
}
