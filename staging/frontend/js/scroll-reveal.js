(() => {
  "use strict";

  const SECTION_SELECTOR = [
    "body.home-page > section:not(.hero-heritage-wrapper):not([hidden])",
    "main section:not([hidden])",
    ".page > section:not([hidden])",
    "#stayDetails > section:not([hidden])"
  ].join(",");

  const CARD_SELECTOR = [
    ".editorial-parchment-card",
    ".nearby-place-card",
    ".testimonial-card",
    ".gallery-card",
    ".property-card",
    ".stay-card",
    ".listing-card",
    ".popular-stay-card",
    ".featured-stay-card",
    ".gallery-item",
    ".card",
    ".popular-stays-track > *",
    "#testimonialTrack > *",
    ".nearby-places-grid > *",
    "#listings > *"
  ].join(",");

  let sectionObserver;
  let cardObserver;
  let mutationObserver;
  let refreshQueued = false;

  function revealSections(root = document) {
    root.querySelectorAll(SECTION_SELECTOR).forEach((section) => {
      if (section.hasAttribute("data-roomo-reveal")) return;
      if (section.closest("[hidden], [aria-hidden='true'], .modal, .nearby-place-modal")) return;
      section.setAttribute("data-roomo-reveal", "");
      sectionObserver.observe(section);
    });
  }

  function revealCards(root = document) {
    const candidates = new Set(root.querySelectorAll(CARD_SELECTOR));

    // Reveal these section headings line by line instead of as one block.
    root.querySelectorAll(
      ".arunachala-editorial-section .row.align-items-center.mb-4 > .col-md-8 > *, " +
      "#testimonials .container > .d-flex > div:first-child > *, " +
      "#testimonials .container > .d-flex > div:nth-child(2) > *"
    ).forEach((element) => candidates.add(element));

    // For Bootstrap-style grids without a dedicated card class, animate each
    // column as a single unit instead of animating every nested element.
    root.querySelectorAll("section .row > [class*='col-']").forEach((column) => {
      if (!column.querySelector(CARD_SELECTOR)) candidates.add(column);
    });

    const groups = new Map();
    candidates.forEach((card) => {
      if (card.hasAttribute("data-roomo-reveal-card")) return;
      if (card.closest("[hidden], [aria-hidden='true'], .modal, .nearby-place-modal")) return;
      const group = card.parentElement;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(card);
    });

    groups.forEach((cards) => {
      cards.forEach((card, index) => {
        card.setAttribute("data-roomo-reveal-card", "");
        card.style.setProperty("--roomo-reveal-delay", Math.min(index, 7) * 90 + "ms");
        cardObserver.observe(card);
      });
    });
  }

  function scan(root = document) {
    revealSections(root);
    revealCards(root);
  }

  function queueScan() {
    if (refreshQueued) return;
    refreshQueued = true;
    window.requestAnimationFrame(() => {
      refreshQueued = false;
      scan();
    });
  }

  function init() {
    if (!("IntersectionObserver" in window)) {
      document.documentElement.classList.add("roomo-reveal-fallback");
      return;
    }

    sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        // Keep the revealed state for the rest of this page session. Never
        // remove this class or observe the same element for a second reveal.
        entry.target.classList.add("is-roomo-visible");
        entry.target.dataset.roomoRevealed = "true";
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -7% 0px" });

    cardObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-roomo-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });

    document.documentElement.classList.add("roomo-reveal-enabled");
    scan();

    mutationObserver = new MutationObserver((mutations) => {
      let shouldScan = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length) shouldScan = true;
        if (mutation.type === "attributes" && mutation.attributeName === "hidden") shouldScan = true;
      });
      if (shouldScan) queueScan();
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden"]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();