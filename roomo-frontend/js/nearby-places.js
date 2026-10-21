(() => {
  "use strict";
  const API = "http://localhost:5001/api/homepage/nearby-places";
  const DEFAULT_CONFIG = {
    title: "Featured Stays",
    description: "Discover memorable places and scenic escapes to add to your sacred journey.",
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
    const viewAll = document.getElementById("nearbyPlacesViewAll");
    const prev = document.getElementById("nearbyPlacesPrev");
    const next = document.getElementById("nearbyPlacesNext");
    if (!section || !track || !title || !description) return;
    const places = Array.isArray(config?.places) ? config.places.filter(place => place && place.visible !== false).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) : [];
    title.textContent = !config?.title || config.title === "Explore Places Around Tiruvannamalai" ? DEFAULT_CONFIG.title : config.title;
    description.textContent = config?.description || DEFAULT_CONFIG.description;
    if (!places.length) { section.hidden = true; return; }
    section.hidden = false;
    track.classList.remove("is-expanded");
    if (viewAll) { viewAll.textContent = "View all"; viewAll.setAttribute("aria-expanded", "false"); viewAll.hidden = places.length <= 4; }
    if (prev) prev.hidden = places.length <= 4;
    if (next) next.hidden = places.length <= 4;
    track.innerHTML = places.map(place => {
      const image = place.imageUrl
        ? '<img src="' + escapeHtml(place.imageUrl) + '" alt="' + escapeHtml(place.name) + ' near Tiruvannamalai" loading="lazy">'
        : '<div class="nearby-place-image-placeholder" aria-hidden="true"><i class="bi bi-geo-alt"></i></div>';
      const mapLink = place.mapUrl
        ? '<a class="nearby-place-map-link" href="' + escapeHtml(place.mapUrl) + '" target="_blank" rel="noopener noreferrer"><i class="bi bi-map"></i> View location</a>'
        : "";
      return '<article class="nearby-place-card"><div class="nearby-place-image">' + image + '</div><div class="nearby-place-content"><h3>' + escapeHtml(place.name) + '</h3><p class="nearby-place-location"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ' + escapeHtml(place.location) + '</p>' + (place.description ? '<p class="nearby-place-description">' + escapeHtml(place.description) + '</p>' : '') + mapLink + '</div></article>';
    }).join("");
    if (viewAll) viewAll.onclick = () => {
      const expanded = track.classList.toggle("is-expanded");
      viewAll.textContent = expanded ? "Show less" : "View all";
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
