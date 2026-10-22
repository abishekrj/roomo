(() => {
  "use strict";
  const API = "http://localhost:5001/api/homepage/shops";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const mapUrl = shop => shop.directionsUrl || ("https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent([shop.name, shop.address || shop.location, "Tiruvannamalai"].filter(Boolean).join(", ")));
  function card(shop) {
    const img = shop.imageUrl ? '<img src="' + esc(shop.imageUrl) + '" alt="' + esc(shop.name) + '" loading="lazy">' : '<div class="shopping-image-placeholder"><i class="bi bi-shop"></i></div>';
    return '<article class="shopping-card"><a class="shopping-card-main" href="shop-details.html?id=' + encodeURIComponent(shop.id) + '"><div class="shopping-card-image">' + img + (shop.offerTag ? '<span class="shopping-offer-badge"><i class="bi bi-tag-fill"></i> ' + esc(shop.offerTag) + '</span>' : '') + '</div><div class="shopping-card-copy"><span class="shopping-category">' + esc(shop.category) + '</span><h3>' + esc(shop.name) + '</h3><p><i class="bi bi-geo-alt"></i> ' + esc(shop.location) + '</p> + (shop.openingHours ? '<p><i class="bi bi-clock"></i> ' + esc(shop.openingHours) + '</p>' : '') + '</div></a><a class="shopping-directions" href="' + esc(mapUrl(shop)) + '" target="_blank" rel="noopener noreferrer"><i class="bi bi-sign-turn-right"></i> Directions</a></article>';
  }
  async function init() {
    const response = await fetch(API, {cache:"no-store"});
    if (!response.ok) throw new Error("Unable to load shops");
    const config = await response.json();
    const shops = (config.shops || []).filter(s => s && s.visible !== false).sort((a,b)=>a.sortOrder-b.sortOrder);
    const detail = new URLSearchParams(location.search).get("id");
    if (detail) {
      const shop = shops.find(s => s.id === detail);
      const root = document.getElementById("shopDetail");
      if (!shop) { root.innerHTML = '<p class="shopping-empty">This shop is unavailable or is no longer published.</p>'; return; }
      document.title = shop.name + " | ROOMO Sacred Shopping Guide";
      const img = shop.imageUrl ? '<img src="' + esc(shop.imageUrl) + '" alt="' + esc(shop.name) + '">' : '<div class="shopping-detail-placeholder"><i class="bi bi-shop"></i></div>';
      root.innerHTML = '<div class="shopping-detail-image">' + img + '</div><div class="shopping-detail-copy"><span class="shopping-category">' + esc(shop.category) + '</span><h1>' + esc(shop.name) + '</h1><p class="shopping-detail-location"><i class="bi bi-geo-alt"></i> ' + esc(shop.location) + '</p>' +
        (shop.address ? '<p><strong>Address:</strong> ' + esc(shop.address) + '</p>' : '') +
        (shop.description ? '<section class="shopping-detail-section"><h2>About this shop</h2><p class="shopping-detail-description">' + esc(shop.description) + '</p></section>' : '') +
        (shop.offerTag ? '<div class="shopping-detail-offer"><i class="bi bi-tag-fill"></i><div><strong>' + esc(shop.offerTag) + '</strong>' + (shop.offerDetails ? '<p>' + esc(shop.offerDetails) + '</p>' : '') + '</div></div>' : '') +
        (shop.specialties ? '<section class="shopping-detail-section"><h2>What you can find here</h2><p class="shopping-detail-description">' + esc(shop.specialties) + '</p></section>' : '') +
        (shop.priceRange ? '<p><i class="bi bi-currency-rupee"></i> <strong>Price range:</strong> ' + esc(shop.priceRange) + '</p>' : '') +
        (shop.openingHours ? '<p><i class="bi bi-clock"></i> <strong>Opening hours:</strong> ' + esc(shop.openingHours) + '</p>' : '') +
        (shop.contactNumber ? '<p><i class="bi bi-telephone"></i> <strong>Contact:</strong> <a href="tel:' + esc(shop.contactNumber.replace(/[^+\d]/g,"")) + '">' + esc(shop.contactNumber) + '</a></p>' : '') +
        '<a class="shopping-primary-link" href="' + esc(mapUrl(shop)) + '" target="_blank" rel="noopener noreferrer"><i class="bi bi-sign-turn-right"></i> Get Google Maps directions</a></div>';
    } else {
      document.getElementById("shopListingTitle").textContent = config.title || "Best Shops for Shopping";
      document.getElementById("shopListingDescription").textContent = config.description || "Discover verified local shops in Tiruvannamalai.";
      const grid = document.getElementById("shopListingGrid");
      grid.innerHTML = shops.length ? shops.map(card).join("") : '<p class="shopping-empty">No shops have been published yet. Please check back soon.</p>';
    }
  }
  init().catch(error => { console.warn(error); const root = document.getElementById("shopListingGrid") || document.getElementById("shopDetail"); if (root) root.innerHTML = '<p class="shopping-empty">We could not load the shopping directory right now. Please try again later.</p>'; });
})();