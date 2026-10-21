(() => {
  "use strict";

  function initRoomoGoogleTranslate() {
    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
      new window.google.translate.TranslateElement({
        pageLanguage: "en",
        includedLanguages: "en,ta,te,kn",
        autoDisplay: false
      }, "google_translate_element");
      return;
    }

    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement({
        pageLanguage: "en",
        includedLanguages: "en,ta,te,kn",
        autoDisplay: false
      }, "google_translate_element");
    };

    if (!document.querySelector('script[data-roomo-google-translate]')) {
      const script = document.createElement("script");
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.dataset.roomoGoogleTranslate = "true";
      script.onerror = () => console.warn("ROOMO language translation could not load.");
      document.head.appendChild(script);
    }
  }

  const GUEST_API_BASE_URL = "http://localhost:5001";
  const GUEST_TOKEN_KEY = "roomoGuestToken";
  const GUEST_USER_KEY = "roomoGuest";

  function getGuestSession() {
    const token = sessionStorage.getItem(GUEST_TOKEN_KEY) || localStorage.getItem(GUEST_TOKEN_KEY);
    const storedUser = sessionStorage.getItem(GUEST_USER_KEY) || localStorage.getItem(GUEST_USER_KEY);
    let user = null;
    try { user = storedUser ? JSON.parse(storedUser) : null; } catch { user = null; }
    return { token, user };
  }

  function setReturnToOnAuthLinks() {
    const returnTo = window.location.pathname + window.location.search + window.location.hash;
    document.querySelectorAll("[data-roomo-auth-link]").forEach(link => {
      const href = link.getAttribute("href") || "";
      if (href === "roomo-login.html" || href === "roomo-signup.html") {
        const target = new URL(href, window.location.href);
        target.searchParams.set("returnTo", returnTo);
        link.href = target.pathname.split("/").pop() + target.search;
      }
    });
  }

  async function initGuestAccountMenu() {
    const toggleName = document.getElementById("roomoAccountName");
    const logoutButton = document.getElementById("roomoLogoutButton");
    const menu = document.getElementById("roomoAccountDropdown");
    if (!toggleName || !menu) return;

    const guestOnlyItems = menu.querySelectorAll("[data-guest-only]");
    const authenticatedItems = menu.querySelectorAll("[data-guest-authenticated]");
    const showLoggedOut = () => {
      toggleName.textContent = "Login / Signup";
      guestOnlyItems.forEach(item => { item.hidden = false; });
      authenticatedItems.forEach(item => { item.hidden = true; });
      setReturnToOnAuthLinks();
    };
    const showLoggedIn = user => {
      const fullName = String(user?.fullName || "").trim();
      toggleName.textContent = fullName || "My Account";
      guestOnlyItems.forEach(item => { item.hidden = true; });
      authenticatedItems.forEach(item => { item.hidden = false; });
    };

    const session = getGuestSession();
    if (!session.token) {
      showLoggedOut();
    } else {
      try {
        const response = await fetch(GUEST_API_BASE_URL + "/api/guest-auth/me", {
          headers: { Authorization: "Bearer " + session.token },
          cache: "no-store"
        });
        if (!response.ok) throw new Error("Guest session expired.");
        const data = await response.json();
        if (!data.user) throw new Error("Guest profile was not returned.");
        const storage = sessionStorage.getItem(GUEST_TOKEN_KEY) ? sessionStorage : localStorage;
        storage.setItem(GUEST_USER_KEY, JSON.stringify(data.user));
        showLoggedIn(data.user);
      } catch (error) {
        sessionStorage.removeItem(GUEST_TOKEN_KEY);
        sessionStorage.removeItem(GUEST_USER_KEY);
        localStorage.removeItem(GUEST_TOKEN_KEY);
        localStorage.removeItem(GUEST_USER_KEY);
        showLoggedOut();
      }
    }

    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem(GUEST_TOKEN_KEY);
        sessionStorage.removeItem(GUEST_USER_KEY);
        localStorage.removeItem(GUEST_TOKEN_KEY);
        localStorage.removeItem(GUEST_USER_KEY);
        showLoggedOut();
        // Stay on the page the guest was viewing when they logged out.
        window.location.reload();
      });
    }
  }

  function selectRoomoLanguage(language) {
    const label = document.getElementById("currentLangText");
    const labels = { en: "ENG", ta: "Tamil", te: "Telugu", kn: "Kannada" };
    if (label) label.textContent = labels[language] || "ENG";

    const applyTranslation = () => {
      const combo = document.querySelector("#google_translate_element select.goog-te-combo");
      if (!combo) return false;
      combo.value = language;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    };

    if (applyTranslation()) return;

    // Google Translate loads asynchronously. Retry briefly without blocking the page.
    let attempts = 0;
    const retry = window.setInterval(() => {
      attempts += 1;
      if (applyTranslation() || attempts >= 20) window.clearInterval(retry);
    }, 250);
  }

  async function applyConfiguredSiteLogo() {
    const logo = document.querySelector(".roomo-brand-logo");
    if (!logo) return;
    try {
      const response = await fetch("http://localhost:5001/api/homepage", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      const url = String(payload?.content?.logoUrl || "").trim();
      if (!url) return;
      const parsed = new URL(url, window.location.href);
      if (!["https:", "http:"].includes(parsed.protocol)) return;
      logo.src = parsed.href;
      logo.onerror = () => { logo.onerror = null; };
    } catch (error) {
      console.warn("ROOMO configured site logo could not be loaded.", error);
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const placeholder = document.getElementById("roomoHeader");
    if (!placeholder) return;

    try {
      const response = await fetch("components/header.html", { cache: "no-cache" });
      if (!response.ok) throw new Error("Header component returned HTTP " + response.status);
      placeholder.outerHTML = await response.text();
      applyConfiguredSiteLogo();
      initRoomoGoogleTranslate();
      setReturnToOnAuthLinks();
      await initGuestAccountMenu();

      document.querySelectorAll("[data-roomo-language]").forEach(button => {
        button.addEventListener("click", () => selectRoomoLanguage(button.dataset.roomoLanguage));
      });
    } catch (error) {
      console.error("ROOMO shared header could not load.", error);
    }
  });
})();