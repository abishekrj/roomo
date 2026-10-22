(() => {
  "use strict";
  const API = "http://localhost:5001/api/homepage/shops";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  function card(shop) {
    const image = shop.imageUrl ? '<img src="' + esc(shop.imageUrl) + '" alt="' + esc(shop.name) + '" loading="lazy">' : '<div class="shopping-image-placeholder"><i class="bi bi-shop"></i></div>';
    const map = shop.directionsUrl || ("https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent([shop.name, shop.address || shop.location, "Tiruvannamalai"].filter(Boolean).join(", ")));
    return '<article class="shopping-card"><a class="shopping-card-main" href="shop-details.html?id=' + encodeURIComponent(shop.id) + '">' +
      '<div class="shopping-card-image">' + image + '</div><div class="shopping-card-copy"><span class="shopping-category">' + esc(shop.category) + '</span><h3>' + esc(shop.name) + '</h3><p><i class="bi bi-geo-alt"></i> ' + esc(shop.location) + '</p>' +
      (shop.openingHours ? '<p><i class="bi bi-clock"></i> ' + esc(shop.openingHours) + '</p>' : '') + '</div></a><a class="shopping-directions" href="' + esc(map) + '" target="_blank" rel="noopener noreferrer"><i class="bi bi-sign-turn-right"></i> Directions</a></article>';
  }
  async function init() {
    const section = document.getElementById("shoppingDirectorySection");
    const track = document.getElementById("shoppingHomeTrack");
    if (!section || !track) {
      console.error("ROOMO Shopping Directory: homepage section or track element is missing.");
      return;
    }
    try {
      const response = await fetch(API, { cache: "no-store" });
      if (!response.ok) throw new Error("Shopping API returned HTTP " + response.status);
      const config = await response.json();
      const shops = Array.isArray(config.shops) ? config.shops.filter(s => s && s.visible !== false).sort((a,b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)) : [];
      if (config.enabled === false || !shops.length) {
        section.hidden = true;
        return;
      }
      document.getElementById("shoppingSectionTitle").textContent = config.title || "Best Shops for Shopping";
      document.getElementById("shoppingSectionDescription").textContent = config.description || "Discover verified local shops in Tiruvannamalai.";
      track.innerHTML = shops.slice(0, 5).map(card).join("");
      section.hidden = false;
      const prev = document.getElementById("shoppingPrev"), next = document.getElementById("shoppingNext");
      if (prev) prev.hidden = shops.length < 2;
      if (next) next.hidden = shops.length < 2;
      const step = direction => {
        const item = track.querySelector(".shopping-card");
        track.scrollBy({ left: direction * (item ? item.getBoundingClientRect().width + 18 : track.clientWidth), behavior: "smooth" });
      };
      if (prev) prev.onclick = () => step(-1);
      if (next) next.onclick = () => step(1);
      console.info("ROOMO Shopping Directory: rendered", shops.length, "published shops.");
    } catch (error) {
      console.error("ROOMO Shopping Directory could not load.", error);
      // Keep the section visible during local development so failures are obvious
      // instead of silently making the whole section disappear.
      section.hidden = false;
      const title = document.getElementById("shoppingSectionTitle");
      const description = document.getElementById("shoppingSectionDescription");
      if (title) title.textContent = "Best Shops for Shopping";
      if (description) description.textContent = "The shopping directory could not load. Check the browser console and confirm the ROOMO API is running on port 5001.";
      track.innerHTML = "";
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();