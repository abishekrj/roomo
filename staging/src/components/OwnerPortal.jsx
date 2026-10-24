import { useEffect, useState } from "react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

const API = "http://localhost:5001";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function OwnerPortal() {
  const [token, setToken] = useState(() => localStorage.getItem("roomo_owner_token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [owner, setOwner] = useState(() => {
    try { return JSON.parse(localStorage.getItem("roomo_owner") || "null"); } catch { return null; }
  });
  const [enquiries, setEnquiries] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  async function loadEnquiries(authToken = token) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(API + "/api/enquiries/owner", { headers: { Authorization: "Bearer " + authToken } });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("roomo_owner_token");
        localStorage.removeItem("roomo_owner");
        setToken(""); setOwner(null);
        throw new Error(data.message || "Please sign in again to access owner enquiries.");
      }
      if (!response.ok) throw new Error(data.message || "Could not load enquiries.");
      setEnquiries(Array.isArray(data.enquiries) ? data.enquiries : []);
    } catch (error) { setMessage(error.message || "Could not load enquiries."); }
    finally { setBusy(false); }
  }

  useEffect(() => { if (token) loadEnquiries(token); }, []);

  async function signIn(event) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const response = await fetch(API + "/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to sign in.");
      if (data.owner?.role !== "OWNER") throw new Error("This login is for property owner accounts.");
      localStorage.setItem("roomo_owner_token", data.token);
      localStorage.setItem("roomo_owner", JSON.stringify(data.owner));
      setToken(data.token); setOwner(data.owner);
      await loadEnquiries(data.token);
    } catch (error) { setMessage(error.message || "Unable to sign in."); }
    finally { setBusy(false); }
  }

  function signOut() {
    localStorage.removeItem("roomo_owner_token");
    localStorage.removeItem("roomo_owner");
    setToken(""); setOwner(null); setEnquiries([]); setPassword(""); setMessage("");
  }

  const filtered = enquiries.filter((item) => [item.property?.title, item.guestName, item.email, item.phone, item.message, item.status]
    .some((value) => String(value || "").toLowerCase().includes(query.toLowerCase())));

  return <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-roomo-ink">
    <Header />
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {!token || !owner ? <div className="mx-auto mt-8 max-w-md rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">ROOMO Partner Portal</p>
        <h1 className="mt-2 text-2xl font-semibold">Owner login</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to view enquiries sent for your properties.</p>
        <form onSubmit={signIn} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">Email address<input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600" /></label>
          <label className="block text-sm font-medium">Password<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600" /></label>
          {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </div> : <>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><p className="text-sm font-semibold uppercase tracking-wider text-blue-700">ROOMO Partner Portal</p><h1 className="mt-1 text-3xl font-semibold">Enquiries</h1><p className="mt-2 text-sm text-slate-600">Welcome, {owner.fullName}. These enquiries are for properties assigned to your account.</p></div>
          <button onClick={signOut} className="self-start rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100">Sign out</button>
        </div>
        {message && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm text-slate-500">Total enquiries</p><p className="text-2xl font-semibold">{enquiries.length}</p></div>
            <div className="flex gap-2"><input aria-label="Search enquiries" placeholder="Search guest or property…" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-72" /><button onClick={() => loadEnquiries()} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-60">{busy ? "Refreshing…" : "Refresh"}</button></div>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {filtered.length === 0 ? <div className="p-10 text-center"><p className="font-semibold">{busy ? "Loading enquiries…" : "No enquiries found"}</p><p className="mt-1 text-sm text-slate-500">{query ? "Try another search term." : "New guest enquiries for your properties will appear here."}</p></div> :
          <div className="divide-y divide-slate-200">{filtered.map((item) => <article key={item.id} className="p-5">
            <div className="flex flex-col justify-between gap-2 sm:flex-row"><div><h2 className="text-lg font-semibold">{item.property?.title || "Property enquiry"}</h2><p className="text-sm text-slate-500">{[item.property?.address, item.property?.city].filter(Boolean).join(", ")}</p></div><span className="h-fit rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{item.status || "NEW"}</span></div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <p><span className="block text-slate-500">Guest</span><strong>{item.guestName}</strong></p>
              <p><span className="block text-slate-500">Email</span><a className="font-medium text-blue-700" href={"mailto:" + item.email}>{item.email}</a></p>
              <p><span className="block text-slate-500">Phone</span><a className="font-medium text-blue-700" href={"tel:" + item.phone}>{item.phone}</a></p>
              <p><span className="block text-slate-500">Check-in</span><strong>{formatDate(item.checkIn)}</strong></p>
              <p><span className="block text-slate-500">Check-out</span><strong>{formatDate(item.checkOut)}</strong></p>
              <p><span className="block text-slate-500">Guests / Rooms</span><strong>{item.adults} adults · {item.rooms} room(s)</strong></p>
            </div>
            {item.message && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm"><span className="mb-1 block font-semibold">Message</span>{item.message}</p>}
            <p className="mt-3 text-xs text-slate-500">Received {formatDate(item.createdAt)} · Enquiry only, not a confirmed booking.</p>
          </article>)}</div>}
        </div>
      </>}
    </main>
    <Footer />
  </div>;
}
