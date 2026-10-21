(() => {
  "use strict";
  const API = "http://localhost:5001/api/homepage/nearby-places/admin";
  const TOKEN_KEY = "roomoAdminToken";
  const $ = id => document.getElementById(id);
  let token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  let config = { title: "Nearby Locations", description: "Discover memorable places and scenic escapes to add to your sacred journey.", places: [] };
  let editingId = null;
  function notice(message, type = "info") { const el = $("pageNotice"); el.textContent = message; el.className = "notice show " + type; }
  async function request(options = {}) {
    let response;
    try { response = await fetch(API, { ...options, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token } }); }
    catch { throw new Error("Cannot connect to ROOMO API. Start the backend on port 5001."); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.message || "Request failed."); error.status = response.status; throw error; }
    return data;
  }
  function formValue() {
    return { id: $("placeId").value.trim(), name: $("placeName").value.trim(), location: $("placeLocation").value.trim(), imageUrl: $("placeImage").value.trim(), mapUrl: $("placeMap").value.trim(), description: $("placeDescription").value.trim(), visible: $("placeVisible").checked, sortOrder: Number($("placeOrder").value || 0) };
  }
  function resetForm() { editingId = null; $("placeForm").reset(); $("placeId").value = ""; $("placeVisible").checked = true; $("placeOrder").value = String(config.places.length + 1); $("formHeading").textContent = "Add nearby location"; $("savePlaceButton").textContent = "Add place"; $("cancelEditButton").hidden = true; }
  function openEdit(place) {
    editingId = place?.id || null;
    $("placeId").value = place?.id || "";
    $("placeName").value = place?.name || "";
    $("placeLocation").value = place?.location || "";
    $("placeImage").value = place?.imageUrl || "";
    $("placeMap").value = place?.mapUrl || "";
    $("placeDescription").value = place?.description || "";
    $("placeVisible").checked = place ? place.visible !== false : true;
    $("placeOrder").value = String(place?.sortOrder ?? config.places.length + 1);
    $("formHeading").textContent = place ? "Edit nearby location" : "Add nearby place";
    $("savePlaceButton").textContent = place ? "Save changes" : "Add place";
    $("cancelEditButton").hidden = !place;
    $("placeFormPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function render() {
    $("placesTitle").value = config.title || "";
    $("placesDescription").value = config.description || "";
    const list = $("nearbyPlacesList"); list.replaceChildren();
    const places = [...config.places].sort((a, b) => a.sortOrder - b.sortOrder);
    $("placesCount").textContent = places.length + " place" + (places.length === 1 ? "" : "s");
    if (!places.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No nearby locations yet. Add the first location above."; list.append(empty); return; }
    places.forEach(place => {
      const card = document.createElement("article"); card.className = "nearby-admin-card" + (place.visible ? "" : " is-hidden");
      const image = document.createElement("div"); image.className = "nearby-admin-thumb";
      if (place.imageUrl) { const img = document.createElement("img"); img.src = place.imageUrl; img.alt = ""; img.loading = "lazy"; image.append(img); } else { image.textContent = "📍"; }
      const copy = document.createElement("div"); copy.className = "nearby-admin-copy";
      const title = document.createElement("strong"); title.textContent = place.name;
      const location = document.createElement("p"); location.textContent = place.location;
      const status = document.createElement("small"); status.textContent = place.visible ? "Visible on homepage · Order " + place.sortOrder : "Hidden from homepage";
      copy.append(title, location, status);
      const actions = document.createElement("div"); actions.className = "nearby-admin-actions";
      const edit = document.createElement("button"); edit.type = "button"; edit.className = "button button-secondary"; edit.textContent = "Edit"; edit.addEventListener("click", () => openEdit(place));
      const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "button button-secondary"; toggle.textContent = place.visible ? "Hide" : "Show"; toggle.addEventListener("click", () => { place.visible = !place.visible; saveAll(); });
      const del = document.createElement("button"); del.type = "button"; del.className = "button button-secondary"; del.textContent = "Delete"; del.addEventListener("click", () => { if (confirm('Delete "' + place.name + '"?')) { config.places = config.places.filter(item => item.id !== place.id); saveAll(); } });
      actions.append(edit, toggle, del); card.append(image, copy, actions); list.append(card);
    });
  }
  async function saveAll(message = "Nearby locations saved and published.") {
    try {
      const data = await request({ method: "PUT", body: JSON.stringify(config) });
      config = data.draft; render(); notice(data.message || message, "success");
    } catch (error) { notice(error.message, "error"); if (error.status === 401) setTimeout(() => location.replace("admin.html"), 900); }
  }
  async function load() {
    const data = await request();
    config = data.draft || config;
    if (config.title === "Explore Places Around Tiruvannamalai" || config.title === "Featured Stays") config.title = "Nearby Locations";
    if (config.description === "Discover scenic hills, peaceful nature escapes and memorable places to visit during your stay.") config.description = "Discover memorable places and scenic escapes to add to your sacred journey.";
    config.places = Array.isArray(config.places) ? config.places : [];
    $("placesTitle").value = config.title; $("placesDescription").value = config.description;
    render(); notice("Nearby Locations loaded. Changes are published immediately.", "info");
  }
  async function init() {
    $("logoutButton").addEventListener("click", () => { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); location.href = "admin.html"; });
    if (!token) { location.replace("admin.html"); return; }
    $("placeForm").addEventListener("submit", async event => {
      event.preventDefault();
      const place = formValue();
      if (!place.name || !place.location) { notice("Place name and location are required.", "error"); return; }
      if (!place.id) {
        const base = place.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 65) || "nearby-place";
        let id = base, suffix = 2; while (config.places.some(item => item.id === id)) id = base + "-" + suffix++;
        place.id = id; place.sortOrder = place.sortOrder || config.places.length + 1; config.places.push(place);
      } else {
        const index = config.places.findIndex(item => item.id === place.id);
        if (index >= 0) config.places[index] = place;
      }
      await saveAll(); resetForm();
    });
    $("cancelEditButton").addEventListener("click", resetForm);
    $("sectionForm").addEventListener("submit", async event => { event.preventDefault(); config.title = $("placesTitle").value.trim(); config.description = $("placesDescription").value.trim(); await saveAll(); });
    try { await load(); } catch (error) { notice(error.message, "error"); if (error.status === 401) { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); setTimeout(() => location.replace("admin.html"), 900); } }
  }
  document.addEventListener("DOMContentLoaded", init);
})();
