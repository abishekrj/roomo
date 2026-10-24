import { useEffect, useState } from "react";
import roomoLogo from "../../../roomo-frontend/assets/roomo-logo.png";

const API_BASE = "http://localhost:5001";
const TOKEN_KEY = "roomoGuestToken";
const USER_KEY = "roomoGuest";
const languages = [{ code: "en", label: "English", short: "ENG" }, { code: "ta", label: "Tamil/தமிழ்", short: "Tamil" }, { code: "te", label: "Telugu/తెలుగు", short: "Telugu" }, { code: "kn", label: "Kannada/ಕನ್ನಡ", short: "Kannada" }];

function readSession() {
  const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
  try { return { token, user: raw ? JSON.parse(raw) : null }; } catch { return { token, user: null }; }
}
const linkClass = "block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50";

export default function Header({ ownerPortal = false, adminNotifications = false } = {}) {
  const [language, setLanguage] = useState(() => languages.find(item => item.code === localStorage.getItem("roomoLanguage")) || languages[0]);
  const [user, setUser] = useState(() => readSession().user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsMessage, setNotificationsMessage] = useState("");

  useEffect(() => {
    let lastY = window.scrollY, frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const y = Math.max(0, window.scrollY);
        setHidden(y > 80 && y > lastY + 4 ? true : y < lastY - 4 || y <= 80 ? false : hidden);
        lastY = y; frame = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [hidden]);

  useEffect(() => {
    let cancelled = false;
    const session = readSession();
    if (!session.token) return;
    fetch(API_BASE + "/api/guest-auth/me", { headers: { Authorization: "Bearer " + session.token }, cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error("Session expired"); const data = await response.json(); if (!data.user) throw new Error("Missing guest profile"); if (!cancelled) { setUser(data.user); const store = sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage; store.setItem(USER_KEY, JSON.stringify(data.user)); } })
      .catch(() => { if (cancelled) return; sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setUser(null); });
    return () => { cancelled = true; };
  }, []);

  const loadAdminNotifications = async () => {
    const adminToken = localStorage.getItem("roomoAdminToken") || sessionStorage.getItem("roomoAdminToken");
    if (!adminToken) { setNotifications([]); setNotificationsMessage("Sign in to view administrator notifications."); return; }
    setNotificationsMessage("Loading notifications…");
    const headers = { Authorization: "Bearer " + adminToken };
    const results = await Promise.allSettled([
      fetch(API_BASE + "/api/admin/properties", { headers, cache: "no-store" }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.message || "Unable to load property activity."); return d; }),
      fetch(API_BASE + "/api/admin/registered-users", { headers, cache: "no-store" }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.message || "Unable to load guest activity."); return d; })
    ]);
    const items = [];
    if (results[0].status === "fulfilled") (results[0].value.properties || []).forEach(p => items.push({ title: "Property listing", detail: (p.title || "Property") + " · " + (p.status || "DRAFT"), date: p.createdAt, href: "/staging/admin/properties" }));
    if (results[1].status === "fulfilled") (results[1].value.users || []).forEach(u => items.push({ title: "Guest registration", detail: (u.fullName || "Guest") + (u.email ? " · " + u.email : ""), date: u.createdAt, href: "/staging/admin/users" }));
    items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    setNotifications(items.slice(0, 15));
    setNotificationsMessage(items.length ? "" : results.every(r => r.status === "rejected") ? "Could not load notifications. Check the backend connection." : "No notifications yet.");
  };
  const authHref = page => { const returnTo = window.location.pathname + window.location.search + window.location.hash; return page + "?returnTo=" + encodeURIComponent(returnTo); };
  const logout = () => { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setUser(null); window.location.reload(); };
  const chooseLanguage = item => {
    setLanguage(item); setLanguageOpen(false);
    try { localStorage.setItem("roomoLanguage", item.code); } catch {}
    const applyLanguage = () => {
      const combo = document.querySelector("#google_translate_element select.goog-te-combo");
      if (!combo) return false;
      combo.value = item.code;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    };
    if (applyLanguage()) return;
    let attempts = 0;
    const retry = window.setInterval(() => {
      attempts += 1;
      if (applyLanguage() || attempts >= 24) window.clearInterval(retry);
    }, 250);
  };

  return (
    <header className={`sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm transition-transform duration-200 ${hidden ? "-translate-y-full" : "translate-y-0"}`}>
      <div className={`flex min-h-[72px] w-full items-center justify-between gap-3 px-4 sm:min-h-[82px] sm:px-6 ${ownerPortal ? "max-w-none" : "mx-auto max-w-7xl"}`}>
        <a className="shrink-0" href="/staging/" aria-label="ROOMO Sacred home"><img className="h-auto w-[125px] object-contain sm:w-[176px]" src={roomoLogo} alt="ROOMO Sacred" width="176" height="58" /></a>
        <div className="hidden items-center gap-2 text-[13px] text-slate-600 md:flex"><i className="bi bi-geo-alt text-roomo-blue" aria-hidden="true" />Tiruvannamalai, Tamil Nadu</div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative notranslate" translate="no">
            <button translate="no" className="notranslate inline-flex items-center gap-1.5 rounded-roomo border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 hover:bg-slate-50 sm:px-3" type="button" aria-expanded={languageOpen} onClick={() => {setLanguageOpen(!languageOpen);setMenuOpen(false);}}><i className="bi bi-translate text-roomo-blue" /><span>{language.short}</span><i className="bi bi-chevron-down text-[10px]" /></button>
            {languageOpen && <div translate="no" className="notranslate absolute right-0 mt-2 min-w-44 rounded-roomo border border-slate-200 bg-white p-1 shadow-lg">{languages.map(item => <button key={item.code} className={`${linkClass} w-full text-left`} type="button" onClick={() => chooseLanguage(item)}>{item.label}</button>)}</div>}
          </div>
          {adminNotifications && <div className="relative notranslate" translate="no">
            <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-roomo border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { const open = !notificationsOpen; setNotificationsOpen(open); setLanguageOpen(false); setMenuOpen(false); if (open) loadAdminNotifications(); }}><i className="bi bi-bell text-lg" aria-hidden="true" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" /></button>
            {notificationsOpen && <div className="absolute right-0 z-[100] mt-2 max-h-[min(70vh,480px)] w-[min(370px,calc(100vw-24px))] overflow-y-auto rounded-roomo border border-slate-200 bg-white text-left shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3"><strong className="text-sm text-slate-800">Notifications</strong><button type="button" className="text-xs font-semibold text-roomo-blue" onClick={loadAdminNotifications}>Refresh</button></div>
              {notifications.length ? notifications.map((item, index) => <a key={item.title + item.detail + index} href={item.href} className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3 text-slate-800 last:border-b-0 hover:bg-slate-50"><strong className="text-xs">{item.title}</strong><span className="break-words text-xs text-slate-600">{item.detail}</span><small className="text-[10px] text-slate-400">{item.date ? new Date(item.date).toLocaleString() : "Recent activity"}</small></a>) : <p className="px-4 py-6 text-center text-xs text-slate-500">{notificationsMessage || "No notifications yet."}</p>}
            </div>}
          </div>}
          {!ownerPortal && <div className="relative">
            <button className="inline-flex items-center gap-2 rounded-roomo border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 hover:bg-slate-50 sm:px-3 sm:text-sm" type="button" aria-expanded={menuOpen} onClick={() => {setMenuOpen(!menuOpen);setLanguageOpen(false);}}><i className="bi bi-person-circle text-base" /><span className="max-w-28 truncate sm:max-w-none">{user?.fullName || "Login / Signup"}</span><i className="bi bi-chevron-down text-[10px]" /></button>
            {menuOpen && <nav className="absolute right-0 mt-2 w-60 rounded-roomo border border-slate-200 bg-white p-2 shadow-lg">
              {!user && <><a className={linkClass} href={authHref("/staging/login")}>Sign In</a><a className={linkClass} href={authHref("/staging/signup")}>Sign Up</a><hr className="my-1 border-slate-100" /></>}
              <a className={linkClass} href="/staging/my-bookings"><i className="bi bi-journal-bookmark mr-2" />My Pilgrimage Bookings</a>
              <a className={linkClass} href={user ? "../roomo-frontend/roomo-my-bookings.html" : authHref("../roomo-frontend/roomo-login.html")}><i className="bi bi-heart mr-2" />Saved Ashrams &amp; Haveli</a>
              {user && <button className={`${linkClass} w-full text-left`} type="button" onClick={logout}>Logout</button>}
            </nav>}
          </div>}
        </div>
      </div>
    </header>
  );
}