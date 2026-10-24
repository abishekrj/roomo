import { useEffect, useState } from "react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

const API = "http://localhost:5001/api";

export default function SuperAdminPortal() {
  const [path, setPath] = useState(window.location.pathname);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [stats, setStats] = useState({ properties: 0, users: 0 });
  const token = localStorage.getItem("roomoAdminToken") || sessionStorage.getItem("roomoAdminToken") || "";
  const loginPage = /\/login\/?$/.test(path) || path === "/admin" || path === "/staging/admin";

  useEffect(() => {
    if (!loginPage && !token) window.location.replace("/staging/admin/login");
  }, [loginPage, token]);

  useEffect(() => {
    if (loginPage || !token) return;
    let cancelled = false;
    const headers = { Authorization: "Bearer " + token };
    Promise.all([
      fetch(API + "/admin/properties", { headers, cache: "no-store" }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.message || "Could not load properties."); return d; }),
      fetch(API + "/admin/registered-users", { headers, cache: "no-store" }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.message || "Could not load registered users."); return d; })
    ]).then(([p, u]) => { if (!cancelled) setStats({ properties: (p.properties || []).length, users: (u.users || []).length }); })
      .catch(e => { if (!cancelled) setNotice(e.message || "Unable to load dashboard data."); });
    return () => { cancelled = true; };
  }, [loginPage, token]);

  async function signIn(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(API + "/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to sign in.");
      if (!data.token || data.owner?.role !== "ADMIN") throw new Error("This account does not have Super Admin access.");
      localStorage.setItem("roomoAdminToken", data.token);
      sessionStorage.removeItem("roomoAdminToken");
      window.location.href = "/staging/admin/dashboard";
    } catch (e) { setError(e.message || "Unable to sign in."); }
    finally { setBusy(false); }
  }

  function signOut() {
    localStorage.removeItem("roomoAdminToken"); sessionStorage.removeItem("roomoAdminToken");
    window.location.href = "/staging/admin/login";
  }

  return <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-roomo-ink">
    <Header ownerPortal adminNotifications />
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      {loginPage ? <section className="mx-auto mt-4 max-w-md">
        <div className="rounded-roomo border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-roomo-blue">ROOMO Sacred · Super Admin</p>
          <h1 className="text-2xl font-semibold text-roomo-ink">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with your authorized administrator account.</p>
          {error && <div role="alert" className="mt-5 rounded-roomo border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <form className="mt-6 space-y-4" onSubmit={signIn}>
            <div><label className="mb-1.5 block text-sm font-medium" htmlFor="super-admin-email">Email address</label><input id="super-admin-email" className="w-full rounded-roomo border border-slate-300 px-3 py-3 text-sm outline-none focus:border-roomo-blue focus:ring-2 focus:ring-blue-100" type="email" autoComplete="username" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><label className="mb-1.5 block text-sm font-medium" htmlFor="super-admin-password">Password</label><input id="super-admin-password" className="w-full rounded-roomo border border-slate-300 px-3 py-3 text-sm outline-none focus:border-roomo-blue focus:ring-2 focus:ring-blue-100" type="password" autoComplete="current-password" required maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /></div>
            <button disabled={busy} className="w-full rounded-roomo bg-roomo-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60" type="submit">{busy ? "Signing in…" : "Sign in to Super Admin"}</button>
          </form>
          <p className="mt-5 text-xs leading-5 text-slate-500">Administrator permissions are verified by the ROOMO backend.</p>
        </div>
      </section> : <section>
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-roomo-blue">Administration</p><h1 className="mt-2 text-3xl font-semibold">Super Admin Dashboard</h1><p className="mt-2 text-sm text-slate-500">Manage ROOMO Sacred platform activity.</p></div><button onClick={signOut} className="rounded-roomo border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100">Sign out</button></div>
        {notice && <p role="status" className="mb-5 rounded-roomo border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{notice}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/staging/admin/properties" className="rounded-roomo border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300"><span className="text-sm text-slate-500">Property listings</span><strong className="mt-3 block text-3xl font-semibold">{stats.properties}</strong><span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-roomo-blue">Manage properties <i className="bi bi-arrow-right" /></span></a>
          <a href="/staging/admin/users" className="rounded-roomo border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300"><span className="text-sm text-slate-500">Registered guests</span><strong className="mt-3 block text-3xl font-semibold">{stats.users}</strong><span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-roomo-blue">View guest accounts <i className="bi bi-arrow-right" /></span></a>
        </div>
      </section>}
    </main>
    <Footer />
  </div>;
}
