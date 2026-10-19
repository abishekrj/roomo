(() => {
  "use strict";

  function initRoomoGoogleTranslate() {
    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
      new window.google.translate.TranslateElement({
        pageLanguage: "en",
        includedLanguages: "en,ta,te",
        autoDisplay: false
      }, "google_translate_element");
      return;
    }

    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement({
        pageLanguage: "en",
        includedLanguages: "en,ta,te",
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

  function selectRoomoLanguage(language) {
    const label = document.getElementById("currentLangText");
    const labels = { en: "ENG", ta: "தமிழ்", te: "తెలుగు" };
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

  document.addEventListener("DOMContentLoaded", async () => {
    const placeholder = document.getElementById("roomoHeader");
    if (!placeholder) return;

    try {
      const response = await fetch("components/header.html", { cache: "no-cache" });
      if (!response.ok) throw new Error("Header component returned HTTP " + response.status);
      placeholder.outerHTML = await response.text();
      initRoomoGoogleTranslate();

      document.querySelectorAll("[data-roomo-language]").forEach(button => {
        button.addEventListener("click", () => selectRoomoLanguage(button.dataset.roomoLanguage));
      });
    } catch (error) {
      console.error("ROOMO shared header could not load.", error);
    }
  });
})();