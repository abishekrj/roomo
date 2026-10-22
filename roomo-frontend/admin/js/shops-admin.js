(() => {
  "use strict";
  const API = "http://localhost:5001/api/homepage/shops/admin";
  const TOKEN_KEY = "roomoAdminToken";
  const $ = id => document.getElementById(id);
  let token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  let config = { enabled: true, title: "Best Shops for Shopping", description: "Discover verified local shops in Tiruvannamalai.", shops: [] };
  function notice(message, type = "info") { const el = $("pageNotice"); el.textContent = message; el.className = "notice show " + type; }
  async function request(options = {}) {
    let response;
    try { response = await fetch(API, { ...options, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token } }); }
    catch { throw new Error("Cannot connect to ROOMO API. Start the backend on port 5001."); }
    const text = await response.text(); let data = {}; try { data = text ? JSON.parse(text) : {}; } catch {}
    if (!response.ok) { const error = new Error(data.message || "Request failed (HTTP " + response.status + ")."); error.status = response.status; throw error; }
    return data;
  }
  function values() {
    return { id: $("shopId").value.trim(), name: $("shopName").value.trim(), category: $("shopCategory").value.trim(), location: $("shopLocation").value.trim(), address: $("shopAddress").value.trim(), openingHours: $("shopHours").value.trim(), contactNumber: $("shopPhone").value.trim(), imageUrl: $("shopImage").value.trim(), directionsUrl: $("shopDirections").value.trim(), description: $("shopDescription").value.trim(), sortOrder: Number($("shopOrder").value || 0), visible: $("shopVisible").checked };
  }
  function reset() {
    $("shopForm").reset(); $("shopId").value = ""; $("shopOrder").value = String(config.shops.length + 1);
    $("formHeading").textContent = "Add a shop"; $("saveShopButton").textContent = "Save shop"; $("cancelEditButton").hidden = true;
  }
  function edit(shop) {
    $("shopId").value = shop.id; $("shopName").value = shop.name || ""; $("shopCategory").value = shop.category || ""; $("shopLocation").value = shop.location || ""; $("shopAddress").value = shop.address || ""; $("shopHours").value = shop.openingHours || ""; $("shopPhone").value = shop.contactNumber || ""; $("shopImage").value = shop.imageUrl || ""; $("shopDirections").value = shop.directionsUrl || ""; $("shopDescription").value = shop.description || ""; $("shopOrder").value = String(shop.sortOrder || 0); $("shopVisible").checked = shop.visible === true;
    $("formHeading").textContent = "Edit shop"; $("saveShopButton").textContent = "Save changes"; $("cancelEditButton").hidden = false; $("shopFormPanel").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function render() {
    $("sectionEnabled").checked = config.enabled !== false; $("sectionTitle").value = config.title || "Best Shops for Shopping"; $("sectionDescription").value = config.description || "";
    const list = $("shopsList"); list.replaceChildren();
    const shops = [...(config.shops || [])].sort((a,b) => a.sortOrder-b.sortOrder);
    $("shopsCount").textContent = shops.length + " shop" + (shops.length === 1 ? "" : "s");
    if (!shops.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No shops added yet. Add verified shop details above; no sample listings are preloaded."; list.append(empty); return; }
    shops.forEach(shop => {
      const card = document.createElement("article"); card.className = "shop-admin-card" + (shop.visible ? "" : " is-hidden");
      const thumb = document.createElement("div"); thumb.className = "shop-thumb";
      if (shop.imageUrl) { const img = document.createElement("img"); img.src = shop.imageUrl; img.alt = ""; img.loading = "lazy"; thumb.append(img); } else thumb.innerHTML = '<i class="bi bi-shop"></i>';
      const copy = document.createElement("div"); copy.className = "shop-copy";
      const title = document.createElement("strong"); title.textContent = shop.name;
      const info = document.createElement("p"); info.textContent = shop.category + " · " + shop.location;
      const status = document.createElement("small"); status.textContent = shop.visible ? "Published · Order " + shop.sortOrder : "Unpublished";
      copy.append(title, info, status);
      const actions = document.createElement("div"); actions.className = "shop-actions";
      const editButton = document.createElement("button"); editButton.type = "button"; editButton.className = "button button-secondary"; editButton.textContent = "Edit"; editButton.onclick = () => edit(shop);
      const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "button button-secondary"; toggle.textContent = shop.visible ? "Unpublish" : "Publish"; toggle.onclick = async () => { shop.visible = !shop.visible; await saveAll(); };
      const del = document.createElement("button"); del.type = "button"; del.className = "button button-secondary"; del.textContent = "Delete"; del.onclick = async () => { if (confirm('Delete "' + shop.name + '"?')) { config.shops = config.shops.filter(s => s.id !== shop.id); await saveAll(); } };
      actions.append(editButton, toggle, del); card.append(thumb, copy, actions); list.append(card);
    });
  }
  async function saveAll() {
    try { const data = await request({method:"PUT",body:JSON.stringify(config)}); config = data.draft || config; render(); notice(data.message || "Shopping directory saved.", "success"); }
    catch (error) { notice(error.message, "error"); }
  }
  async function load() { const data = await request(); config = data.draft || config; config.shops = Array.isArray(config.shops) ? config.shops : []; render(); notice("Shopping directory loaded. Changes are published immediately.", "info"); }
  async function init() {
    $("logoutButton").onclick = () => { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); location.href = "admin.html"; };
    if (!token) { location.replace("admin.html"); return; }
    $("sectionForm").onsubmit = async event => { event.preventDefault(); config.enabled = $("sectionEnabled").checked; config.title = $("sectionTitle").value.trim(); config.description = $("sectionDescription").value.trim(); await saveAll(); };
    $("shopForm").onsubmit = async event => {
      event.preventDefault(); const shop = values();
      if (!shop.name || !shop.category || !shop.location) { notice("Shop name, category and location are required.", "error"); return; }
      if (!shop.id) {
        const base = shop.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,65) || "shop";
        let id = base, n = 2; while (config.shops.some(s => s.id === id)) id = base + "-" + n++;
        shop.id = id; shop.sortOrder = shop.sortOrder || config.shops.length + 1; config.shops.push(shop);
      } else { const index = config.shops.findIndex(s => s.id === shop.id); if (index >= 0) config.shops[index] = shop; }
      await saveAll(); reset();
    };
    $("cancelEditButton").onclick = reset;
    try { await load(); } catch (error) { notice(error.message, "error"); if (error.status === 401) setTimeout(() => location.replace("admin.html"), 900); }
  }
  document.addEventListener("DOMContentLoaded", init);
})();