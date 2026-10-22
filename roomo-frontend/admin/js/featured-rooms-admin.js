(() => {
  "use strict";
  const API = "http://localhost:5001/api", TOKEN_KEY = "roomoAdminToken";
  const $ = id => document.getElementById(id);
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  let properties = [];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  function notice(message, type = "info") { const el = $("pageNotice"); el.textContent = message; el.className = "notice show " + type; }
  async function request(path, options = {}) {
    let response;
    try { response = await fetch(API + path, { ...options, headers: { ...(token ? { Authorization: "Bearer " + token } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}) } }); }
    catch { throw new Error("Cannot connect to ROOMO API. Start the backend on port 5001."); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  }
  function imageFor(property) { return property.images?.[0]?.imageUrl || ""; }
  function render() {
    const list = $("roomEditorList");
    if (!properties.length) {
      list.innerHTML = '<div class="empty-state">No properties are selected yet. Open Rooms Listings, search for a property, and enable its Featured Rooms checkbox.</div>';
      return;
    }
    list.innerHTML = properties.map((p, index) => {
      const image = imageFor(p);
      return '<article class="room-editor-card" data-property-id="' + esc(p.id) + '"><div class="room-editor-card-head"><div><h3>' + (index + 1) + '. ' + esc(p.title) + '</h3><p class="muted small">' + esc([p.city, p.state].filter(Boolean).join(", ")) + ' · ₹' + Number(p.nightlyPrice || 0).toLocaleString("en-IN") + ' / night</p></div><div class="editor-actions"><button type="button" class="button button-secondary" data-move="up" ' + (index === 0 ? "disabled" : "") + ' aria-label="Move ' + esc(p.title) + ' up">↑ Move up</button><button type="button" class="button button-secondary" data-move="down" ' + (index === properties.length - 1 ? "disabled" : "") + ' aria-label="Move ' + esc(p.title) + ' down">↓ Move down</button></div></div><div class="featured-property-summary">' + (image ? '<img class="room-preview" style="display:block" src="' + esc(image) + '" alt="' + esc(p.title) + '">' : '<div class="muted small">No property image uploaded</div>') + '<div><strong>' + esc(p.status) + '</strong><p class="muted small">' + esc(p.description || "") + '</p><p class="muted small">' + esc((p.images || []).length) + ' image(s) · Main image is the first image selected in Rooms Listings.</p></div></div></article>';
    }).join("");
  }
  async function load() {
    const data = await request("/admin/homepage/featured-rooms");
    $("sectionTitle").value = data.title || "Revered Pilgrim Sanctuaries";
    $("sectionDescription").value = data.description || "";
    properties = (data.properties || []).filter(p => p.isFeatured).sort((a, b) => Number(a.featuredSortOrder || 0) - Number(b.featuredSortOrder || 0));
    render();
  }
  function moveProperty(id, direction) {
    const index = properties.findIndex(p => p.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= properties.length) return;
    [properties[index], properties[next]] = [properties[next], properties[index]];
    render();
  }
  document.addEventListener("DOMContentLoaded", async () => {
    $("logoutButton").addEventListener("click", () => { sessionStorage.removeItem(TOKEN_KEY); location.href = "admin.html"; });
    if (!token) { location.replace("admin.html"); return; }
    $("roomEditorList").addEventListener("click", event => {
      const button = event.target.closest("[data-move]");
      if (!button) return;
      const card = button.closest("[data-property-id]");
      moveProperty(card.dataset.propertyId, button.dataset.move === "up" ? -1 : 1);
    });
    $("reloadButton").addEventListener("click", async () => { try { await load(); notice("Featured section content reloaded.", "success"); } catch (error) { notice(error.message, "error"); } });
    try { await load(); } catch (error) { notice(error.message, "error"); return; }
    $("featuredRoomsForm").addEventListener("submit", async event => {
      event.preventDefault();
      const button = $("saveButton"); button.disabled = true; button.textContent = "Saving…";
      try {
        const payload = { title: $("sectionTitle").value.trim(), description: $("sectionDescription").value.trim(), propertyIds: properties.map(p => p.id) };
        const data = await request("/admin/homepage/featured-rooms", { method: "PUT", body: JSON.stringify(payload) });
        properties = (data.properties || properties).filter(p => p.isFeatured).sort((a, b) => Number(a.featuredSortOrder || 0) - Number(b.featuredSortOrder || 0));
        render();
        notice(data.message || "Section content and featured order saved.", "success");
      } catch (error) { notice(error.message, "error"); }
      finally { button.disabled = false; button.textContent = "Save Section & Display Order"; }
    });
  });
})();