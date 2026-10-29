import { useEffect, useRef, useState } from "react";
import roomoLogo from "/assets/roomo-logo.png";

const API_BASE = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";
function csrfHeaders() { const item = document.cookie.split("; ").find(part => part.startsWith("roomo_csrf=")); return item ? { "X-CSRF-Token": decodeURIComponent(item.slice("roomo_csrf=".length)) } : {}; }
const languages = [{ code: "en", label: "English", short: "ENG" }, { code: "ta", label: "Tamil/தமிழ்", short: "Tamil" }, { code: "te", label: "Telugu/తెలుగు", short: "Telugu" }, { code: "kn", label: "Kannada/ಕನ್ನಡ", short: "Kannada" }];

const linkClass = "block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50";

export default function Header({ ownerPortal = false, adminNotifications = false } = {}) {
  const [language, setLanguage] = useState(() => languages.find(item => item.code === localStorage.getItem("roomoLanguage")) || languages[0]);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const languageRef = useRef(null);
  const notificationsRef = useRef(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsMessage, setNotificationsMessage] = useState("");

  useEffect(() => {
    const closeOnOutsideClick = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      if (languageRef.current && !languageRef.current.contains(event.target)) setLanguageOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setNotificationsOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMobileMenuOpen(false);
        setLanguageOpen(false);
        setNotificationsOpen(false);
      }
    };
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
    if (results[0].status === "fulfilled") (results[0].value.properties || []).forEach(p => items.push({ title: "Property listing", detail: (p.title || "Property") + " · " + (p.status || "DRAFT"), date: p.createdAt, href: "/admin/dashboard" }));
    if (results[1].status === "fulfilled") (results[1].value.users || []).forEach(u => items.push({ title: "Guest registration", detail: (u.fullName || "Guest") + (u.email ? " · " + u.email : ""), date: u.createdAt, href: "/admin/dashboard" }));
    items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    setNotifications(items.slice(0, 15));
    setNotificationsMessage(items.length ? "" : results.every(r => r.status === "rejected") ? "Could not load notifications. Check the backend connection." : "No notifications yet.");
  };
  const authHref = page => { const returnTo = window.location.pathname + window.location.search + window.location.hash; return page + "?returnTo=" + encodeURIComponent(returnTo); };
  const logout = async () => { try { await fetch(API_BASE + "/guest-auth/logout", { method: "POST", credentials: "include", headers: csrfHeaders() }); } finally { localStorage.removeItem("roomoGuest"); setUser(null); window.history.pushState({}, "", "/"); window.dispatchEvent(new PopStateEvent("popstate")); } };
  const chooseLanguage = item => {
    setLanguage(item);
    setLanguageOpen(false);
    try { localStorage.setItem("roomoLanguage", item.code); } catch {}

    // Google Translate can finish initializing after the user opens the menu.
    // Retry until its language selector is ready, rather than stopping just
    // because the hidden widget container exists.
    let attempts = 0;
    const applyLanguage = () => {
      const combo = document.querySelector("#google_translate_element select.goog-te-combo");
      const translateReady = Boolean(window.google?.translate?.TranslateElement && combo);
      if (!translateReady) return false;

      if (combo.value !== item.code) {
        combo.value = item.code;
        combo.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        // Re-apply the selected language when the user chooses it again.
        combo.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return true;
    };

    if (applyLanguage()) return;
    const retry = window.setInterval(() => {
      attempts += 1;
      if (applyLanguage() || attempts >= 40) window.clearInterval(retry);
    }, 250);
  };

  return (
    <header className={`sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm transition-transform duration-200 ${hidden ? "-translate-y-full" : "translate-y-0"}`}>
      <div className={`mx-auto flex min-h-[72px] w-full items-center justify-between gap-3 px-4 sm:min-h-[82px] sm:px-6 ${ownerPortal ? "max-w-none" : "max-w-7xl"}`}>
        {!ownerPortal && <button type="button" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-blue-50 hover:text-[#2563a6] lg:hidden" aria-label={mobileMenuOpen ? "Close main menu" : "Open main menu"} aria-expanded={mobileMenuOpen} onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setMenuOpen(false); setLanguageOpen(false); }}><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{mobileMenuOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}</svg></button>}
        <a className="roomo-logo-link shrink-0 focus:outline-none" href="/" aria-label="ROOMO Sacred home"><img className="h-auto w-[125px] border-0 object-contain outline-none sm:w-[176px]" src={roomoLogo} alt="ROOMO Sacred" width="176" height="58" /></a>

        {!ownerPortal && <nav aria-label="Main navigation" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          <a href="/" className={`rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-blue-50 hover:text-[#2563a6] ${window.location.pathname === "/" || window.location.pathname === "" ? "text-[#2563a6]" : "text-slate-700"}`}>Home</a>
          <a href="/properties" className={`rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-blue-50 hover:text-[#2563a6] ${window.location.pathname.startsWith("/properties") || window.location.pathname.startsWith("/property-details") ? "text-[#2563a6]" : "text-slate-700"}`}>Stays</a>
          <a href="/transport-booking" className={`rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-blue-50 hover:text-[#2563a6] ${window.location.pathname.startsWith("/transport-booking") ? "text-[#2563a6]" : "text-slate-700"}`}>Travels</a>
        </nav>}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {adminNotifications && <div className="relative" ref={notificationsRef}>
            <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-roomo border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { const open = !notificationsOpen; setNotificationsOpen(open); setLanguageOpen(false); setMenuOpen(false); if (open) loadAdminNotifications(); }}><i className="bi bi-bell text-lg" aria-hidden="true" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" /></button>
            {notificationsOpen && <div className="absolute right-0 z-[100] mt-2 max-h-[min(70vh,480px)] w-[min(370px,calc(100vw-24px))] overflow-y-auto rounded-roomo border border-slate-200 bg-white text-left shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3"><strong className="text-sm text-slate-800">Notifications</strong><button type="button" className="text-xs font-semibold text-roomo-blue" onClick={loadAdminNotifications}>Refresh</button></div>
              {notifications.length ? notifications.map((item, index) => <a key={item.title + item.detail + index} href={item.href} className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3 text-slate-800 last:border-b-0 hover:bg-slate-50"><strong className="text-xs">{item.title}</strong><span className="break-words text-xs text-slate-600">{item.detail}</span><small className="text-[10px] text-slate-400">{item.date ? new Date(item.date).toLocaleString() : "Recent activity"}</small></a>) : <p className="px-4 py-6 text-center text-xs text-slate-500">{notificationsMessage || "No notifications yet."}</p>}
            </div>}
          </div>}
          {!ownerPortal && <div className="relative" ref={menuRef}>
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-roomo border border-[#2563a6] bg-[#2563a6] px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1e4f85] sm:px-3 sm:text-sm" type="button" aria-label={user?.fullName || (authChecked ? "Login / Signup" : "Account")} title={user?.fullName || (authChecked ? "Login / Signup" : "Account")} aria-expanded={menuOpen} aria-haspopup="true" onClick={() => {setMenuOpen(!menuOpen);setLanguageOpen(false);}}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg>
              <span className="hidden max-w-32 truncate sm:inline">{user?.fullName || (authChecked ? "Login / Signup" : "Account")}</span>
              <svg className="hidden h-3 w-3 sm:inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {menuOpen && <nav className="absolute right-0 z-[100] mt-2 w-60 rounded-roomo border border-slate-200 bg-white p-2 shadow-lg">
              {!authChecked ? <p className="px-3 py-2 text-sm text-slate-500" role="status">Checking your account…</p> : <>
                {!user && <><a className={linkClass} href={authHref("/login")}>Sign In</a><a className={linkClass} href={authHref("/signup")}>Sign Up</a><a className={`${linkClass} font-semibold text-[#8a6200]`} href="/owner/signup">Bring Your Property</a><hr className="my-1 border-slate-100" /></>}
                <a className={linkClass} href="/my-bookings">My Travel</a>
                <a className={linkClass} href={user ? "/my-profile" : authHref("/login")}>My Profile</a>
                {user && <><a className={linkClass} href="/owner/signup">Bring Your Property</a><button className={`${linkClass} w-full text-left`} type="button" onClick={logout}>Logout</button></>}
              </>}
            </nav>}
          </div>}

          <div className="relative notranslate shrink-0" translate="no" ref={languageRef}>
            <button translate="no" className="notranslate inline-flex min-h-10 items-center gap-1.5 rounded-roomo border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 hover:bg-slate-50 sm:px-3" type="button" aria-expanded={languageOpen} onClick={() => {setLanguageOpen(!languageOpen);setMenuOpen(false);}}>
              <i className="bi bi-translate text-[#2563a6]" aria-hidden="true" /><span>{language.short}</span><i className="bi bi-chevron-down text-[10px]" aria-hidden="true" />
            </button>
            {languageOpen && <div translate="no" className="notranslate absolute right-0 mt-2 min-w-44 rounded-roomo border border-slate-200 bg-white p-1 shadow-lg">{languages.map(item => <button key={item.code} className={`${linkClass} w-full text-left`} type="button" onClick={() => chooseLanguage(item)}>{item.label}</button>)}</div>}
          </div>
        </div>
      </div>
      {!ownerPortal && mobileMenuOpen && <nav aria-label="Mobile main navigation" className="border-t border-slate-200 bg-white px-4 py-3 shadow-md lg:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-1"><a onClick={() => setMobileMenuOpen(false)} href="/" className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#2563a6]">Home</a><a onClick={() => setMobileMenuOpen(false)} href="/properties" className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#2563a6]">Stays</a><a onClick={() => setMobileMenuOpen(false)} href="/transport-booking" className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#2563a6]">Travels</a></div></nav>}
    </header>
  );
}