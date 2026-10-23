import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5001";
const TOKEN_KEY = "roomoGuestToken";
const USER_KEY = "roomoGuest";

function readSession() {
  const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
  try { return { token, user: raw ? JSON.parse(raw) : null }; }
  catch { return { token, user: null }; }
}

export default function Header() {
  const [language, setLanguage] = useState("ENG");
  const [user, setUser] = useState(() => readSession().user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const y = Math.max(0, window.scrollY);
        setHidden(y > 80 && y > lastY + 4 ? true : y < lastY - 4 ? false : y <= 80 ? false : hidden);
        lastY = y;
        frame = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [hidden]);

  useEffect(() => {
    let cancelled = false;
    const session = readSession();
    if (!session.token) return;
    fetch(API_BASE + "/api/guest-auth/me", {
      headers: { Authorization: "Bearer " + session.token }, cache: "no-store"
    }).then(async response => {
      if (!response.ok) throw new Error("Session expired");
      const data = await response.json();
      if (!data.user) throw new Error("Missing guest profile");
      if (!cancelled) {
        setUser(data.user);
        const store = sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage;
        store.setItem(USER_KEY, JSON.stringify(data.user));
      }
    }).catch(() => {
      if (cancelled) return;
      sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY);
      setUser(null);
    });
    return () => { cancelled = true; };
  }, []);

  const authHref = (page) => {
    const returnTo = window.location.pathname + window.location.search + window.location.hash;
    return page + "?returnTo=" + encodeURIComponent(returnTo);
  };
  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY);
    setUser(null); window.location.reload();
  };
  const chooseLanguage = (code, label) => {
    setLanguage(label);
    // Preserve the legacy language selection behavior without injecting Google's toolbar into the page.
    const combo = document.querySelector("#google_translate_element select.goog-te-combo");
    if (combo) { combo.value = code; combo.dispatchEvent(new Event("change", { bubbles: true })); }
  };

  return (
    <header className={"roomo-header" + (hidden ? " roomo-header--hidden" : "")}>
      <div className="container roomo-header-inner">
        <a className="roomo-header-logo" href="../roomo-frontend/index.html" aria-label="ROOMO Sacred home">
          <img src="../roomo-frontend/assets/roomo-logo.png" alt="ROOMO Sacred" width="176" height="58" />
        </a>
        <div className="roomo-location d-none d-md-flex"><i className="bi bi-geo-alt" aria-hidden="true"></i> Tiruvannamalai, Tamil Nadu</div>
        <div className="roomo-header-actions">
          <div className="dropdown">
            <button className="btn roomo-pill-button dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="bi bi-translate text-primary" aria-hidden="true"></i><span>{language}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><button className="dropdown-item" onClick={() => chooseLanguage("en", "ENG")}>English</button></li>
              <li><button className="dropdown-item" onClick={() => chooseLanguage("ta", "Tamil")}>Tamil/தமிழ்</button></li>
              <li><button className="dropdown-item" onClick={() => chooseLanguage("te", "Telugu")}>Telugu/తెలుగు</button></li>
              <li><button className="dropdown-item" onClick={() => chooseLanguage("kn", "Kannada")}>Kannada/ಕನ್ನಡ</button></li>
            </ul>
          </div>
          <div className="dropdown">
            <button className="btn roomo-pill-button dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="bi bi-person-circle" aria-hidden="true"></i><span>{user?.fullName || "Login / Signup"}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              {!user && <><li><a className="dropdown-item" href={authHref("../roomo-frontend/roomo-login.html")}>Sign In</a></li><li><a className="dropdown-item" href={authHref("../roomo-frontend/roomo-signup.html")}>Sign Up</a></li><li><hr className="dropdown-divider" /></li></>}
              <li><a className="dropdown-item" href="../roomo-frontend/roomo-my-bookings.html"><i className="bi bi-journal-bookmark me-2"></i>My Pilgrimage Bookings</a></li>
              <li><a className="dropdown-item" href={user ? "../roomo-frontend/roomo-my-bookings.html" : authHref("../roomo-frontend/roomo-login.html")}><i className="bi bi-heart me-2"></i>Saved Ashrams &amp; Haveli</a></li>
              {user && <li><button className="dropdown-item" type="button" onClick={logout}>Logout</button></li>}
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}