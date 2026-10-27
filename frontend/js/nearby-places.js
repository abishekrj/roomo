(() => {
  "use strict";
  const API = "http://localhost:5001/api/homepage/nearby-places";
  const DEFAULT_CONFIG = {
    title: "Nearby Locations",
    description: "Explore familiar landmarks, scenic escapes and memorable destinations around Tiruvannamalai.",
    places: [
      { id: "sathanur-dam", name: "Sathanur Dam", location: "Sathanur, Tiruvannamalai District, Tamil Nadu", description: "A scenic dam and reservoir surrounded by green hills and peaceful countryside.", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80", mapUrl: "https://www.google.com/maps/search/?api=1&query=Sathanur+Dam+Tamil+Nadu", visible: true, sortOrder: 1 },
      { id: "yelagiri-hills", name: "Yelagiri Hills", location: "Yelagiri, Tirupattur District, Tamil Nadu", description: "A hill retreat known for fresh air, scenic viewpoints and outdoor activities.", imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80", mapUrl: "https://www.google.com/maps/search/?api=1&query=Yelagiri+Hills+Tamil+Nadu", visible: true, sortOrder: 2 },
      { id: "parvathamalai", name: "Parvathamalai", location: "Thenmathimangalam, Tiruvannamalai District, Tamil Nadu", description: "A revered hill destination popular with devotees and experienced trekkers.", imageUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=80", mapUrl: "https://www.google.com/maps/search/?api=1&query=Parvathamalai+Tamil+Nadu", visible: true, sortOrder: 3 },
      { id: "gingee-fort", name: "Gingee Fort", location: "Gingee, Villupuram District, Tamil Nadu", description: "A remarkable historic fort complex set across dramatic rocky hilltops.", imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80", mapUrl: "https://www.google.com/maps/search/?api=1&query=Gingee+Fort+Tamil+Nadu", visible: true, sortOrder: 4 },
      { id: "javadu-hills", name: "Javadu Hills", location: "Eastern Ghats, Tamil Nadu", description: "A quiet hill region with forest landscapes, village life and scenic drives.", imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80", mapUrl: "https://www.google.com/maps/search/?api=1&query=Javadu+Hills+Tamil+Nadu", visible: true, sortOrder: 5 }
    ]
  };
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  function render(config) {
    const section = document.getElementById("nearbyPlacesSection");
    const title = document.getElementById("nearbyPlacesTitle");
    const description = document.getElementById("nearbyPlacesDescription");
    const track = document.getElementById("nearbyPlacesGrid");
    if (!section || !track || !title || !description) return;
    const heading = section.querySelector(".nearby-places-heading");
    let controls = section.querySelector(".nearby-places-controls");
    if (!controls && heading) {
      controls = document.createElement("div");
      controls.className = "nearby-places-controls";
      controls.setAttribute("aria-label", "Nearby locations controls");
      controls.innerHTML = '<button type="button" class="nearby-places-view-all" id="nearbyPlacesViewAll">View all <i class="bi bi-arrow-right-short fs-6"></i></button><button type="button" class="nearby-places-arrow" id="nearbyPlacesPrev" aria-label="Previous nearby locations"><i class="bi bi-chevron-left"></i></button><button type="button" class="nearby-places-arrow" id="nearbyPlacesNext" aria-label="Next nearby locations"><i class="bi bi-chevron-right"></i></button>';
      heading.appendChild(controls);
    }
    const viewAll = controls?.querySelector("#nearbyPlacesViewAll");
    const prev = controls?.querySelector("#nearbyPlacesPrev");
    const next = controls?.querySelector("#nearbyPlacesNext");
    const places = Array.isArray(config?.places) ? config.places.filter(place => place && place.visible !== false).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) : [];
    title.textContent = !config?.title || config.title === "Explore Places Around Tiruvannamalai" ? DEFAULT_CONFIG.title : (config.title === "Featured Stays" ? DEFAULT_CONFIG.title : config.title);
    description.textContent = config?.description || DEFAULT_CONFIG.description;
    if (config?.enabled === false || !places.length) { section.hidden = true; return; }
    section.hidden = false;
    track.classList.remove("is-expanded");
    if (viewAll) { viewAll.innerHTML = 'View all <i class="bi bi-arrow-right-short fs-6"></i>'; viewAll.setAttribute("aria-expanded", "false"); viewAll.hidden = places.length <= 4; }
    if (prev) prev.hidden = places.length <= 4;
    if (next) next.hidden = places.length <= 4;
    track.innerHTML = places.map(place => {
      const image = place.imageUrl
        ? '<img src="' + escapeHtml(place.imageUrl) + '" alt="' + escapeHtml(place.name) + ' near Tiruvannamalai" loading="lazy">'
        : '<div class="nearby-place-image-placeholder" aria-hidden="true"><i class="bi bi-geo-alt"></i></div>';
      const mapLink = place.mapUrl
        ? '<a class="nearby-place-map-link" href="' + escapeHtml(place.mapUrl) + '" target="_blank" rel="noopener noreferrer"><i class="bi bi-map"></i> View location</a>'
        : "";
      return '<article class="nearby-place-card" tabindex="0" role="button" aria-label="View details for ' + escapeHtml(place.name) + '" data-place-id="' + escapeHtml(place.id) + '"><div class="nearby-place-image">' + image + '</div><div class="nearby-place-content"><h3>' + escapeHtml(place.name) + '</h3><p class="nearby-place-location"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ' + escapeHtml(place.location) + '</p>' + (place.description ? '<p class="nearby-place-description">' + escapeHtml(place.description) + '</p>' : '') + '<span class="nearby-place-details-link">Explore details <i class="bi bi-arrow-up-right"></i></span>' + mapLink + '</div></article>';
    }).join("");
    const modal = document.getElementById("nearbyPlaceModal");
    const closeModal = () => {
      if (!modal) return;
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("nearby-place-modal-open");
    };
    const openModal = place => {
      if (!modal || !place) return;
      const modalImage = document.getElementById("nearbyPlaceModalImage");
      const modalTitle = document.getElementById("nearbyPlaceModalTitle");
      const modalLocation = document.getElementById("nearbyPlaceModalLocation");
      const modalDescription = document.getElementById("nearbyPlaceModalDescription");
      const modalMap = document.getElementById("nearbyPlaceModalMap");
      modalImage.innerHTML = place.imageUrl ? '<img src="' + escapeHtml(place.imageUrl) + '" alt="' + escapeHtml(place.name) + '">' : '<div class="nearby-place-modal-placeholder"><i class="bi bi-geo-alt"></i></div>';
      modalTitle.textContent = place.name || "Nearby location";
      modalLocation.textContent = place.location || "";
      modalDescription.textContent = place.description || "Discover this destination around Tiruvannamalai and plan a visit during your stay.";
      modalMap.href = place.mapUrl || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([place.name, place.location].filter(Boolean).join(" "));
      modalMap.hidden = !place.mapUrl && !place.location;
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("nearby-place-modal-open");
      const closeButton = modal.querySelector(".nearby-place-modal-close");
      if (closeButton) closeButton.focus();
    };
    track.querySelectorAll(".nearby-place-card").forEach(card => {
      const place = places.find(item => String(item.id) === card.dataset.placeId);
      card.addEventListener("click", event => { if (!event.target.closest("a")) openModal(place); });
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openModal(place); }
      });
    });
    if (modal && !modal.dataset.bound) {
      modal.querySelectorAll("[data-nearby-modal-close]").forEach(el => el.addEventListener("click", closeModal));
      document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) closeModal(); });
      modal.dataset.bound = "true";
    }
    if (viewAll) viewAll.onclick = () => {
      const expanded = track.classList.toggle("is-expanded");
      viewAll.innerHTML = expanded ? 'Show less <i class="bi bi-arrow-right-short fs-6"></i>' : 'View all <i class="bi bi-arrow-right-short fs-6"></i>';
      viewAll.setAttribute("aria-expanded", String(expanded));
      if (prev) prev.hidden = expanded || places.length <= 4;
      if (next) next.hidden = expanded || places.length <= 4;
      if (!expanded) track.scrollTo({ left: 0, behavior: "smooth" });
    };
    const scrollTrack = direction => {
      if (track.classList.contains("is-expanded")) return;
      const card = track.querySelector(".nearby-place-card");
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap) || 16;
      const count = 1;
      track.scrollBy({ left: direction * (card ? (card.getBoundingClientRect().width + gap) * count : track.clientWidth), behavior: "smooth" });
    };
    if (prev) prev.onclick = () => scrollTrack(-1);
    if (next) next.onclick = () => scrollTrack(1);
  }
  async function init() {
    try {
      const response = await fetch(API, { cache: "no-store" });
      if (!response.ok) throw new Error("Nearby places API returned HTTP " + response.status);
      render(await response.json());
    } catch (error) {
      console.warn("ROOMO nearby places API unavailable; showing built-in places until the API connects.", error);
      render(DEFAULT_CONFIG);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
