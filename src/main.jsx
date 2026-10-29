import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Keep ordinary same-origin page links inside the React app. Forms, downloads,
// external links, new-tab links and in-page anchors retain native browser behavior.
document.addEventListener("click", event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!link || link.hasAttribute("download") || link.target === "_blank" || link.dataset.nativeNavigation === "true") return;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin || url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
  if (url.pathname.startsWith("/uploads/") || url.pathname.startsWith("/api/")) return;
  event.preventDefault();
  window.history.pushState({}, "", url.pathname + url.search + url.hash);
  window.dispatchEvent(new PopStateEvent("popstate"));
  if (url.pathname === window.location.pathname && url.hash) {
    document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
  } else {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
