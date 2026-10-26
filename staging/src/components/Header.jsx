import { useEffect, useRef, useState } from "react";
import roomoLogo from "../../../roomo-frontend/assets/roomo-logo.png";

const API_BASE = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";
function csrfHeaders() { const item = document.cookie.split("; ").find(part => part.startsWith("roomo_csrf=")); return item ? { "X-CSRF-Token": decodeURIComponent(item.slice("roomo_csrf=".length)) } : {}; }
const languages = [{ code: "en", label: "English", short: "ENG" }, { code: "ta", label: "Tamil/தமிழ்", short: "Tamil" }, { code: "te", label: "Telugu/తెలుగు", short: "Telugu" }, { code: "kn", label: "Kannada/ಕನ್ನಡ", short: "Kannada" }];

const linkClass = "block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50";

export default function Header({ ownerPortal = false, adminNotifications = false } = {}) {
  const [language, setLanguage] = useState(() => languages.find(item => item.code === localStorage.getItem("roomoLanguage")) || languages[0]);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsMessage, setNotificationsMessage] = useState("");

  useEffect(() => {
    const closeOnOutsideClick = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = event => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOnOutsideClick); document.removeEventListener("keydown", closeOnEscape); };
  }, []);

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
    // Remove legacy client-side guest profiles/tokens and locally cached favourites.
    // Authentication and favourites now come from the HttpOnly session and API.
    for (const storage of [localStorage, sessionStorage]) {
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index);
        if (key === "roomoGuest" || key === "roomoGuestToken" || key?.startsWith("roomoFavourites:")) {
          storage.removeItem(key);
        }
      }
    }
    let cancelled = false;
    fetch(API_BASE + "/guest-auth/me", { credentials: "include", cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error("No active guest session"); const data = await response.json(); if (!data.user) throw new Error("Missing guest profile"); if (!cancelled) setUser(data.user); })
      .catch(() => { if (!cancelled) { setUser(null); localStorage.removeItem("roomoGuest"); } })
      .finally(() => { if (!cancelled) setAuthChecked(true); });
    return () => { cancelled = true; };
  }, []);

  const loadAdminNotifications = async () => {
    setNotificationsMessage("Loading notifications…");
    const headers = {};
    const results = await Promise.allSettled([
      fetch(API_BASE + "/admin/properties", { headers, credentials: "include", cache: "no-store" }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.message || "Unable to load property activity."); return d; }),
      fetch(API_BASE + "/admin/registered-users", { headers, credentials: "include", cache: "no-store" }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.message || "Unable to load guest activity."); return d; })
    ]);
    const items = [];
    if (results[0].status === "fulfilled") (results[0].value.properties || []).forEach(p => items.push({ title: "Property listing", detail: (p.title || "Property") + " · " + (p.status || "DRAFT"), date: p.createdAt, href: "/staging/admin/dashboard" }));
    if (results[1].status === "fulfilled") (results[1].value.users || []).forEach(u => items.push({ title: "Guest registration", detail: (u.fullName || "Guest") + (u.email ? " · " + u.email : ""), date: u.createdAt, href: "/staging/admin/dashboard" }));
    items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    setNotifications(items.slice(0, 15));
    setNotificationsMessage(items.length ? "" : results.every(r => r.status === "rejected") ? "Could not load notifications. Check the backend connection." : "No notifications yet.");
  };
  const authHref = page => { const returnTo = window.location.pathname + window.location.search + window.location.hash; return page + "?returnTo=" + encodeURIComponent(returnTo); };
  const logout = async () => { try { await fetch(API_BASE + "/guest-auth/logout", { method: "POST", credentials: "include", headers: csrfHeaders() }); } finally { localStorage.removeItem("roomoGuest"); setUser(null); window.location.reload(); } };
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
      <div className={`mx-auto flex min-h-[72px] w-full items-center justify-between gap-3 px-4 sm:min-h-[82px] sm:px-6 ${ownerPortal ? "max-w-none" : "max-w-7xl"}`}>
        <a className="roomo-logo-link shrink-0 focus:outline-none" href="/staging/" aria-label="ROOMO Sacred home"><img className="h-auto w-[125px] border-0 object-contain outline-none sm:w-[176px]" src={roomoLogo} alt="ROOMO Sacred" width="176" height="58" /></a>

        {!ownerPortal && <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          <a href="/staging/" className={`rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-blue-50 hover:text-[#2563a6] ${window.location.pathname === "/staging/" || window.location.pathname === "/staging" ? "text-[#2563a6]" : "text-slate-700"}`}>Home</a>
          <a href="/staging/properties" className={`rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-blue-50 hover:text-[#2563a6] ${window.location.pathname.startsWith("/staging/properties") || window.location.pathname.startsWith("/staging/property-details") ? "text-[#2563a6]" : "text-slate-700"}`}>Stays</a>
          <a href="/staging/transport-booking" className={`rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-blue-50 hover:text-[#2563a6] ${window.location.pathname.startsWith("/staging/transport-booking") ? "text-[#2563a6]" : "text-slate-700"}`}>Travels</a>
        </nav>}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {!ownerPortal && <div className="relative" ref={menuRef}>
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-roomo border border-[#2563a6] bg-[#2563a6] px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1e4f85] sm:px-3 sm:text-sm" type="button" aria-label={user?.fullName || (authChecked ? "Login / Signup" : "Account")} title={user?.fullName || (authChecked ? "Login / Signup" : "Account")} aria-expanded={menuOpen} aria-haspopup="true" onClick={() => {setMenuOpen(!menuOpen);setLanguageOpen(false);}}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg>
              <span className="hidden max-w-32 truncate sm:inline">{user?.fullName || (authChecked ? "Login / Signup" : "Account")}</span>
              <svg className="hidden h-3 w-3 sm:inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {menuOpen && <nav className="absolute right-0 z-[100] mt-2 w-60 rounded-roomo border border-slate-200 bg-white p-2 shadow-lg">
              {!authChecked ? <p className="px-3 py-2 text-sm text-slate-500" role="status">Checking your account…</p> : <>
                {!user && <><a className={linkClass} href={authHref("/staging/login")}>Sign In</a><a className={linkClass} href={authHref("/staging/signup")}>Sign Up</a><a className={`${linkClass} font-semibold text-[#8a6200]`} href="/staging/owner/signup">Bring Your Property</a><hr className="my-1 border-slate-100" /></>}
                <a className={linkClass} href="/staging/my-bookings">My Travel</a>
                <a className={linkClass} href={user ? "/staging/my-profile" : authHref("/staging/login")}>My Profile</a>
                {user && <><a className={linkClass} href="/staging/owner/signup">Bring Your Property</a><button className={`${linkClass} w-full text-left`} type="button" onClick={logout}>Logout</button></>}
              </>}
            </nav>}
          </div>}

          <div className="relative notranslate shrink-0" translate="no">
            <button translate="no" className="notranslate inline-flex min-h-10 items-center gap-1.5 rounded-roomo border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 hover:bg-slate-50 sm:px-3" type="button" aria-expanded={languageOpen} onClick={() => {setLanguageOpen(!languageOpen);setMenuOpen(false);}}>
              <i className="bi bi-translate text-[#2563a6]" aria-hidden="true" /><span>{language.short}</span><i className="bi bi-chevron-down text-[10px]" aria-hidden="true" />
            </button>
            {languageOpen && <div translate="no" className="notranslate absolute right-0 mt-2 min-w-44 rounded-roomo border border-slate-200 bg-white p-1 shadow-lg">{languages.map(item => <button key={item.code} className={`${linkClass} w-full text-left`} type="button" onClick={() => chooseLanguage(item)}>{item.label}</button>)}</div>}
          </div>
        </div>
      </div>
    </header>
  );
}