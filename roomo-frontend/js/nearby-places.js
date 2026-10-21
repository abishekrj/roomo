(() => {
  "use strict";
  const API = "http://localhost:5001/api/homepage/nearby-places";
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  function render(config) {
    const section = document.getElementById("nearbyPlacesSection");
    const title = document.getElementById("nearbyPlacesTitle");
    const description = document.getElementById("nearbyPlacesDescription");
    const track = document.getElementById("nearbyPlacesGrid");
    if (!section || !track) return;
    const places = Array.isArray(config?.places) ? config.places : [];
    title.textContent = config?.title || "Explore Places Around Tiruvannamalai";
    description.textContent = config?.description || "Discover scenic hills, peaceful nature escapes and memorable places to visit during your stay.";
    if (!places.length) { section.hidden = true; return; }
    section.hidden = false;
    track.innerHTML = places.map(place => {
      const image = place.imageUrl
        ? '<img src="' + escapeHtml(place.imageUrl) + '" alt="' + escapeHtml(place.name) + ' near Tiruvannamalai" loading="lazy">'
        : '<div class="nearby-place-image-placeholder" aria-hidden="true"><i class="bi bi-geo-alt"></i></div>';
      const mapLink = place.mapUrl
        ? '<a class="nearby-place-map-link" href="' + escapeHtml(place.mapUrl) + '" target="_blank" rel="noopener noreferrer"><i class="bi bi-map"></i> View location</a>'
        : "";
      return '<article class="nearby-place-card"><div class="nearby-place-image">' + image + '</div><div class="nearby-place-content"><h3>' + escapeHtml(place.name) + '</h3><p class="nearby-place-location"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ' + escapeHtml(place.location) + '</p>' + (place.description ? '<p class="nearby-place-description">' + escapeHtml(place.description) + '</p>' : '') + mapLink + '</div></article>';
    }).join("");
  }
  async function init() {
    try {
      const response = await fetch(API, { cache: "no-store" });
      if (!response.ok) throw new Error("Nearby places unavailable");
      render(await response.json());
    } catch (error) {
      console.warn("ROOMO nearby places could not be loaded.", error);
      const section = document.getElementById("nearbyPlacesSection");
      if (section) section.hidden = true;
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
