(() => {
  "use strict";
  const API = "http://localhost:5001/api/homepage/shops";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const mapUrl = shop => shop.directionsUrl || ("https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent([shopName(shop), shop.address || shop.location, "Tiruvannamalai"].filter(Boolean).join(", ")));
  const shopPhotos = [
    { terms: /pooja|spiritual|temple|flower|incense|puja|religious/i, url: "https://images.unsplash.com/photo-1606293926075-69a00db143d5?auto=format&fit=crop&w=1400&q=85" },
    { terms: /silk|saree|textile|cloth|dress|fashion|garment|boutique/i, url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=85" },
    { terms: /sweet|snack|food|bakery|restaurant|grocery|provision|fruit|spice/i, url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&q=85" },
    { terms: /handicraft|craft|souvenir|wood|brass|pottery|handloom|artisan/i, url: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1400&q=85" },
    { terms: /jewel|gold|silver|ornament/i, url: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=85" },
    { terms: /book|stationery|print|gift/i, url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1400&q=85" },
    { terms: /ayur|herbal|organic|wellness|health/i, url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1400&q=85" }
  ];
  const shopName = shop => String(shop?.name ?? "").replace(/^SAMPLE\s*[—–-]\s*/i, "").trim();
  const shopImage = shop => {
    if (shop.imageUrl) return shop.imageUrl;
    const text = [shop.name, shop.category, shop.specialties, shop.description].filter(Boolean).join(" ");
    const match = shopPhotos.find(item => item.terms.test(text));
    const fallbackPhotos = [
      "https://images.unsplash.com/photo-1606293926075-69a00db143d5?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1400&q=85"
    ];
    const index = Array.from(String(shop.id || shop.name || "shop")).reduce((sum, char) => sum + char.charCodeAt(0), 0) % fallbackPhotos.length;
    return (match ? match.url : fallbackPhotos[index]);
  };
  const shopName = shop => String(shop?.name ?? "").replace(/^SAMPLE\s*[—–-]\s*/i, "").trim();
  
  function offerLabel(value) { const label = String(value ?? "").trim(); return /^\d+(?:\.\d+)?\s*%\s*(?:OFF)?$/i.test(label) && !/\bOFF\b/i.test(label) ? label + " OFF" : label; }
  function card(shop) {
    const name = shopName(shop);
    const imageUrl = shopImage(shop);
    const img = imageUrl ? '<img src="' + esc(imageUrl) + '" alt="' + esc(name) + '" loading="lazy">' : '<div class="shopping-image-placeholder"><i class="bi bi-shop"></i></div>';
    return '<article class="shopping-card"><a class="shopping-card-main" href="shop-details.html?id=' + encodeURIComponent(shop.id) + '"><div class="shopping-card-image">' + img + (shop.offerTag ? '<span class="shopping-offer-badge"><i class="bi bi-tag-fill"></i> ' + esc(offerLabel(shop.offerTag)) + '</span>' : '') + '</div><div class="shopping-card-copy"><span class="shopping-category">' + esc(shop.category) + '</span><h3>' + esc(name) + '</h3><p><i class="bi bi-geo-alt"></i> ' + esc(shop.location) + '</p>' + (shop.openingHours ? '<p><i class="bi bi-clock"></i> ' + esc(shop.openingHours) + '</p>' : '') + '</div></a><a class="shopping-directions" href="' + esc(mapUrl(shop)) + '" target="_blank" rel="noopener noreferrer"><i class="bi bi-sign-turn-right"></i> Directions</a></article>';
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
      const name = shopName(shop);
      document.title = name + " | ROOMO Sacred Shopping Guide";
      const imageUrl = shopImage(shop);
      const img = imageUrl ? '<img src="' + esc(imageUrl) + '" alt="' + esc(name) + '">' : '<div class="shopping-detail-placeholder"><i class="bi bi-shop"></i></div>';
      root.innerHTML = '<div class="shopping-detail-image">' + img + '</div><div class="shopping-detail-copy"><span class="shopping-category">' + esc(shop.category) + '</span><h1>' + esc(name) + '</h1><p class="shopping-detail-location"><i class="bi bi-geo-alt"></i> ' + esc(shop.location) + '</p>' +
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