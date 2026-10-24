import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import SuperAdminWorkspace from "./SuperAdminWorkspace.jsx";

const API = "http://localhost:5001/api";
const homeSections = [
  ["header", "Header"], ["hero-banner", "Hero Banner"], ["search-section", "Search Section"],
  ["featured-stays", "Featured Stays"], ["upcoming-festival", "Upcoming Festival"],
  ["pilgrim-guide", "Pilgrim Guide"], ["nearby-locations", "Nearby Locations"],
  ["galleries", "Galleries"], ["shopping-directory", "Shopping Directory"],
  ["testimonials", "Testimonials"], ["footer", "Footer"]
];

export default function SuperAdminPortal() {
  const [path] = useState(window.location.pathname);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [stats, setStats] = useState({ properties: 0, users: 0 });
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [heroDraft, setHeroDraft] = useState({});
  const [heroBusy, setHeroBusy] = useState(false);
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroUploadBusy, setHeroUploadBusy] = useState(false);

  const token = localStorage.getItem("roomoAdminToken") || sessionStorage.getItem("roomoAdminToken") || "";
  const currentPath = path.replace(/\/+$/, "") || "/";
  const loginPage = /\/login$/.test(currentPath) || currentPath === "/admin" || currentPath === "/staging/admin";
  const routePrefix = currentPath.startsWith("/staging/admin") ? "/staging/admin" : "/admin";
  const isHomePageEditor = currentPath.includes("/homepage/");
  const homePageSection = isHomePageEditor ? currentPath.split("/homepage/")[1] : "";
  const isHeroEditor = homePageSection === "hero-banner";
  const activePage = isHomePageEditor ? homePageSection : currentPath.endsWith("/properties") ? "properties" : currentPath.endsWith("/users") ? "users" : currentPath.endsWith("/enquiries") ? "enquiries" : currentPath.endsWith("/owners") ? "owners" : currentPath.includes("/rooms/") ? "rooms" : currentPath.endsWith("/cms-pages") ? "cms-pages" : currentPath.endsWith("/destinations") ? "destinations" : currentPath.endsWith("/nearby-locations") ? "nearby-places" : currentPath.endsWith("/shopping-directory") ? "shops" : currentPath.endsWith("/testimonials") ? "testimonials" : currentPath.includes("/gallery/") ? "gallery" : currentPath.endsWith("/reports") ? "reports" : "dashboard";
  const adminPageTitles = {
    enquiries: "Enquiries", owners: "Owners", "rooms/add": "Add Rooms", "rooms/listings": "Room Listings",
    "rooms/types": "Room Types", "rooms/filters": "Room Filters", "rooms/featured": "Featured Rooms",
    "rooms/listing-display": "Listing Display Settings", "cms-pages": "CMS Pages", destinations: "Destinations",
    "nearby-locations": "Nearby Locations", "shopping-directory": "Shopping Directory", testimonials: "Testimonials",
    "gallery/add": "Add Gallery", "gallery/list": "Gallery List", reports: "Reports"
  };
  const adminPageKey = currentPath.startsWith(routePrefix + "/") ? currentPath.slice(routePrefix.length + 1) : "";
  const pageTitles = Object.fromEntries(homeSections);

  useEffect(() => {
    if (!loginPage && !token) window.location.replace("/staging/admin/login");
  }, [loginPage, token]);

  useEffect(() => {
    if (loginPage || !token || isHomePageEditor) return;
    let cancelled = false;
    const headers = { Authorization: "Bearer " + token };
    Promise.all([
      fetch(API + "/admin/properties", { headers, cache: "no-store" }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.message || "Could not load properties."); return d; }),
      fetch(API + "/admin/registered-users", { headers, cache: "no-store" }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.message || "Could not load registered users."); return d; })
    ]).then(([p, u]) => {
      if (cancelled) return;
      setProperties(p.properties || []);
      setUsers(u.users || []);
      setStats({ properties: (p.properties || []).length, users: (u.users || []).length });
    }).catch(e => { if (!cancelled) setNotice(e.message || "Unable to load dashboard data."); });
    return () => { cancelled = true; };
  }, [loginPage, token, isHomePageEditor]);

  useEffect(() => {
    if (loginPage || !token || !isHeroEditor) return;
    let cancelled = false;
    setHeroLoading(true);
    fetch(API + "/admin/homepage", { headers: { Authorization: "Bearer " + token }, cache: "no-store" })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Could not load the saved homepage draft.");
        return data;
      })
      .then(data => {
        if (cancelled) return;
        setHeroDraft({ ...(data.draft || {}) });
        setNotice(data.hasPublished ? "Draft loaded. Live content stays unchanged until you publish." : "Draft loaded. Publish when you are ready for visitors to see it.");
      })
      .catch(e => { if (!cancelled) setNotice(e.message || "Unable to load hero banner draft."); })
      .finally(() => { if (!cancelled) setHeroLoading(false); });
    return () => { cancelled = true; };
  }, [loginPage, token, isHeroEditor]);

  async function signIn(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to sign in.");
      if (!data.token || data.owner?.role !== "ADMIN") throw new Error("This account does not have Super Admin access.");
      localStorage.setItem("roomoAdminToken", data.token);
      sessionStorage.removeItem("roomoAdminToken");
      window.location.href = "/staging/admin/dashboard";
    } catch (e) {
      setError(e.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    localStorage.removeItem("roomoAdminToken");
    sessionStorage.removeItem("roomoAdminToken");
    window.location.href = "/staging/admin/login";
  }

  function updateHeroField(event) {
    setHeroDraft(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function saveHeroDraft(event) {
    event.preventDefault();
    setHeroBusy(true);
    setNotice("");
    try {
      const response = await fetch(API + "/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(heroDraft)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to save hero banner draft.");
      setNotice(data.message || "Draft saved. Publish the homepage to make your changes live.");
    } catch (e) {
      setNotice(e.message || "Unable to save hero banner draft.");
    } finally {
      setHeroBusy(false);
    }
  }

  async function publishHeroDraft() {
    if (!window.confirm("Publish the saved homepage draft? This publishes the complete homepage draft, not only the hero banner.")) return;
    setHeroBusy(true);
    setNotice("");
    try {
      const response = await fetch(API + "/admin/homepage/publish", {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to publish homepage.");
      setNotice(data.message || "Homepage published successfully.");
    } catch (e) {
      setNotice(e.message || "Unable to publish homepage.");
    } finally {
      setHeroBusy(false);
    }
  }

  async function uploadHeroImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setNotice("Choose an image smaller than 8 MB.");
      event.target.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setNotice("Choose a JPG, PNG, WebP or AVIF image.");
      event.target.value = "";
      return;
    }
    const formData = new FormData();
    formData.append("image", file);
    setHeroUploadBusy(true);
    setNotice("");
    try {
      const response = await fetch(API + "/admin/homepage/hero-image", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: formData
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Image upload failed.");
      setHeroDraft(current => ({ ...current, heroImageUrl: data.heroImageUrl || current.heroImageUrl }));
      setNotice("Image uploaded. Save Draft, then publish to make it live.");
    } catch (e) {
      setNotice(e.message || "Image upload failed.");
    } finally {
      setHeroUploadBusy(false);
      event.target.value = "";
    }
  }

  const inputClass = "mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-roomo-blue focus:ring-2 focus:ring-blue-100";
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "▦", href: routePrefix + "/dashboard" },
    { id: "enquiries", label: "Enquiries", icon: "▤", href: routePrefix + "/enquiries" },
    { id: "owners", label: "Owners", icon: "♙", href: routePrefix + "/owners" },
    { id: "rooms", label: "Rooms", icon: "⌂", children: [
      ["Add Rooms", routePrefix + "/rooms/add"], ["Room Listings", routePrefix + "/rooms/listings"],
      ["Room Types", routePrefix + "/rooms/types"], ["Room Filters", routePrefix + "/rooms/filters"],
      ["Featured Rooms", routePrefix + "/rooms/featured"], ["Listing Display Settings", routePrefix + "/rooms/listing-display"]
    ] },
    { id: "home-page", label: "Home Page", icon: "▧", children: homeSections.map(([id, label]) => [label, routePrefix + "/homepage/" + id]) },
    { id: "cms-pages", label: "CMS Pages", icon: "▤", href: routePrefix + "/cms-pages" },
    { id: "destinations", label: "Destinations", icon: "⌖", href: routePrefix + "/destinations" },
    { id: "nearby-places", label: "Nearby Locations", icon: "⌁", href: routePrefix + "/nearby-locations" },
    { id: "shops", label: "Shopping Directory", icon: "▣", href: routePrefix + "/shopping-directory" },
    { id: "testimonials", label: "Testimonials", icon: "❝", href: routePrefix + "/testimonials" },
    { id: "gallery", label: "Gallery", icon: "▧", children: [["Add Gallery", routePrefix + "/gallery/add"], ["Gallery List", routePrefix + "/gallery/list"]] },
    { id: "reports", label: "Reports", icon: "▥", href: routePrefix + "/reports" },
    { id: "properties", label: "Property Listings", icon: "⌂", href: routePrefix + "/properties" },
    { id: "users", label: "Registered Users", icon: "♙", href: routePrefix + "/users" }
  ];

  return <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-roomo-ink">
    <Header ownerPortal adminNotifications />
    <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {loginPage ? <section className="mx-auto mt-4 max-w-md">
        <div className="rounded-roomo border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-roomo-blue">ROOMO Sacred · Super Admin</p>
          <h1 className="text-2xl font-semibold text-roomo-ink">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with your authorized administrator account.</p>
          {error && <div role="alert" className="mt-5 rounded-roomo border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <form className="mt-6 space-y-4" onSubmit={signIn}>
            <div><label className="mb-1.5 block text-sm font-medium" htmlFor="super-admin-email">Email address</label><input id="super-admin-email" className={inputClass} type="email" autoComplete="username" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><label className="mb-1.5 block text-sm font-medium" htmlFor="super-admin-password">Password</label><input id="super-admin-password" className={inputClass} type="password" autoComplete="current-password" required maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /></div>
            <button disabled={busy} className="w-full rounded-roomo bg-roomo-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60" type="submit">{busy ? "Signing in…" : "Sign in to Super Admin"}</button>
          </form>
          <p className="mt-5 text-xs leading-5 text-slate-500">Administrator permissions are verified by the ROOMO backend.</p>
        </div>
      </section> : <section>
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit rounded-roomo bg-[#102747] p-4 text-white lg:sticky lg:top-24">
            <div className="px-3 pb-5 pt-2"><p className="text-xl font-semibold tracking-tight">ROOMO</p><p className="mt-1 text-[10px] font-semibold tracking-[.18em] text-blue-200">SUPER ADMIN</p></div>
            <p className="px-3 pb-3 text-[10px] font-semibold tracking-[.16em] text-slate-400">WORKSPACE</p>
            <nav className="space-y-1" aria-label="Super Admin navigation">
              {navItems.map(item => item.children ? <details key={item.id} className="group rounded-lg" open={(item.id === "home-page" && isHomePageEditor) || (item.id === "rooms" && activePage === "rooms") || (item.id === "gallery" && activePage === "gallery") ? true : undefined}>
                <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"><span className="w-5 text-center text-lg" aria-hidden="true">{item.icon}</span><span className="flex-1">{item.label}</span><span className="text-xs transition group-open:rotate-180" aria-hidden="true">⌄</span></summary>
                <div className="ml-5 space-y-1 border-l border-white/15 py-1 pl-3">{item.children.map(([label, href]) => <a key={label} href={href} className={isHomePageEditor && href.endsWith("/" + homePageSection) ? "block rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold leading-5 text-white" : "block rounded-md px-3 py-2 text-xs leading-5 text-slate-300 transition hover:bg-white/10 hover:text-white"}>{label}</a>)}</div>
              </details> : <a key={item.id} href={item.href} aria-current={activePage === item.id ? "page" : undefined} className={activePage === item.id ? "flex items-center gap-3 rounded-lg bg-blue-600 px-3 py-3 text-sm font-medium text-white shadow-sm" : "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"}><span className="w-5 text-center text-lg" aria-hidden="true">{item.icon}</span>{item.label}</a>)}
            </nav>
            <div className="mt-6 border-t border-white/10 pt-4"><p className="px-3 text-xs text-slate-300">Platform administration</p><button onClick={signOut} className="mt-3 w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Sign out</button></div>
          </aside>
          <div className="min-w-0">
            <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[.16em] text-roomo-blue">Administration</p><h1 className="mt-2 text-3xl font-semibold">{isHomePageEditor ? (pageTitles[homePageSection] || "Home Page") : adminPageTitles[adminPageKey] || (activePage === "properties" ? "Property Listings" : activePage === "users" ? "Registered Users" : "Super Admin Dashboard")}</h1><p className="mt-2 text-sm text-slate-500">Manage ROOMO Sacred platform activity.</p></div>
            {notice && <p role="status" className="mb-5 rounded-roomo border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{notice}</p>}
            {isHeroEditor && <section className="rounded-roomo border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[.16em] text-roomo-blue">Home Page / Hero Banner</p><h2 className="mt-2 text-xl font-semibold">Edit hero banner</h2><p className="mt-2 text-sm leading-6 text-slate-500">Edit the badge, heading, supporting text and hero image. Save Draft first; publish the saved homepage draft when ready.</p></div>
              {heroLoading ? <p className="p-6 text-sm text-slate-500">Loading saved hero content…</p> : <form onSubmit={saveHeroDraft} className="space-y-5 p-5 sm:p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block text-sm font-medium md:col-span-2">Small badge<input name="heroBadge" value={heroDraft.heroBadge || ""} onChange={updateHeroField} maxLength={160} required className={inputClass} /></label>
                  <label className="block text-sm font-medium">Main heading — first line<input name="heroTitleLine" value={heroDraft.heroTitleLine || ""} onChange={updateHeroField} maxLength={120} required className={inputClass} /></label>
                  <label className="block text-sm font-medium">Highlighted heading line<input name="heroTitleAccent" value={heroDraft.heroTitleAccent || ""} onChange={updateHeroField} maxLength={120} required className={inputClass} /></label>
                  <label className="block text-sm font-medium md:col-span-2">Introductory paragraph<textarea name="heroDescription" value={heroDraft.heroDescription || ""} onChange={updateHeroField} maxLength={1000} required rows={4} className={inputClass} /></label>
                  <label className="block text-sm font-medium md:col-span-2">Hero image URL<input name="heroImageUrl" type="url" value={heroDraft.heroImageUrl || ""} onChange={updateHeroField} maxLength={2000} required className={inputClass} placeholder="https://example.com/hero-image.jpg" /><span className="mt-1 block text-xs font-normal text-slate-500">Use a public HTTPS image URL, or upload an image below (maximum 8 MB).</span></label>
                  <div className="md:col-span-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><span>{heroUploadBusy ? "Uploading image…" : "Upload hero image"}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={uploadHeroImage} disabled={heroUploadBusy} className="sr-only" /></label>
                    {heroDraft.heroImageUrl && <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2"><img src={heroDraft.heroImageUrl} alt="Hero banner preview" className="max-h-64 w-full rounded-md object-contain" onError={e => { e.currentTarget.style.display = "none"; }} /><p className="mt-2 break-all text-xs text-slate-500">{heroDraft.heroImageUrl}</p></div>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5"><button type="submit" disabled={heroBusy || heroLoading} className="rounded-lg bg-roomo-blue px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{heroBusy ? "Saving…" : "Save Draft"}</button><button type="button" onClick={publishHeroDraft} disabled={heroBusy || heroLoading} className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">{heroBusy ? "Please wait…" : "Publish Homepage"}</button><button type="button" onClick={() => window.open("/staging/", "_blank", "noopener,noreferrer")} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Preview homepage ↗</button></div>
                <p className="text-xs leading-5 text-slate-500">Publishing uses the existing homepage publishing workflow and can publish other sections currently saved in the homepage draft too.</p>
              </form>}
            </section>}
            {isHomePageEditor && !isHeroEditor && <SuperAdminWorkspace pageKey={adminPageKey} token={token} onNotice={setNotice} />}
            {adminPageTitles[adminPageKey] && !isHomePageEditor && <SuperAdminWorkspace pageKey={adminPageKey} token={token} onNotice={setNotice} />}
            {activePage === "dashboard" && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><a href={routePrefix + "/properties"} className="rounded-roomo border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300"><span className="text-sm text-slate-500">Property listings</span><strong className="mt-3 block text-3xl font-semibold">{stats.properties}</strong><span className="mt-3 block text-sm font-semibold text-roomo-blue">Manage properties →</span></a><a href={routePrefix + "/users"} className="rounded-roomo border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300"><span className="text-sm text-slate-500">Registered guests</span><strong className="mt-3 block text-3xl font-semibold">{stats.users}</strong><span className="mt-3 block text-sm font-semibold text-roomo-blue">View accounts →</span></a></div>}
            {activePage === "properties" && <section className="overflow-hidden rounded-roomo border border-slate-200 bg-white"><div className="border-b p-5"><h2 className="font-semibold">Property listings</h2><p className="mt-1 text-sm text-slate-500">Properties returned by the admin API.</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Property</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{properties.map((item, i) => <tr key={item.id || i}><td className="px-5 py-4 font-medium">{item.title || item.name || "Untitled property"}</td><td className="px-5 py-4">{[item.city, item.address].filter(Boolean).join(", ") || "—"}</td><td className="px-5 py-4">{item.status || "—"}</td></tr>)}{!properties.length && <tr><td colSpan="3" className="px-5 py-8 text-center text-slate-500">No property listings found.</td></tr>}</tbody></table></div></section>}
            {activePage === "users" && <section className="overflow-hidden rounded-roomo border border-slate-200 bg-white"><div className="border-b p-5"><h2 className="font-semibold">Registered users</h2><p className="mt-1 text-sm text-slate-500">Guest accounts returned by the admin API.</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Registered</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((item, i) => <tr key={item.id || i}><td className="px-5 py-4 font-medium">{item.fullName || item.name || "Guest"}</td><td className="px-5 py-4">{item.email || "—"}</td><td className="px-5 py-4">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td></tr>)}{!users.length && <tr><td colSpan="3" className="px-5 py-8 text-center text-slate-500">No registered users found.</td></tr>}</tbody></table></div></section>}
          </div>
        </div>
      </section>}
    </main>
    {!loginPage && <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:px-6">© {new Date().getFullYear()} ROOMO. All rights reserved.</footer>}
  </div>;
}
