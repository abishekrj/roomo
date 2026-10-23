(() => {
  "use strict";
  const API = "http://localhost:5001/api/homepage/shops";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
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
  function offerLabel(value) { const label = String(value ?? "").trim(); return /^\d+(?:\.\d+)?\s*%\s*(?:OFF)?$/i.test(label) && !/\bOFF\b/i.test(label) ? label + " OFF" : label; }
  function card(shop) {
    const imageUrl = shopImage(shop);
    const name = shopName(shop);
    const image = imageUrl ? '<img src="' + esc(imageUrl) + '" alt="' + esc(name) + '" loading="lazy" onerror="var f=[\'https://images.unsplash.com/photo-1606293926075-69a00db143d5?auto=format&fit=crop&w=1000&q=80\',\'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80\',\'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=80\'];var i=Number(this.dataset.fallbackIndex||0);if(i<f.length){this.dataset.fallbackIndex=i+1;this.src=f[i]}else{this.onerror=null;this.parentElement.classList.add(\'shopping-image-failed\');this.style.display=\'none\'}">' : '<div class="shopping-image-placeholder"><i class="bi bi-shop"></i></div>';
    const map = shop.directionsUrl || ("https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent([name, shop.address || shop.location, "Tiruvannamalai"].filter(Boolean).join(", ")));
    return '<article class="shopping-card"><a class="shopping-card-main" href="shop-details.html?id=' + encodeURIComponent(shop.id) + '">' +
      '<div class="shopping-card-image">' + image + (shop.offerTag ? '<span class="shopping-offer-badge"><i class="bi bi-tag-fill"></i> ' + esc(offerLabel(shop.offerTag)) + '</span>' : '') + '</div><div class="shopping-card-copy"><span class="shopping-category">' + esc(shop.category) + '</span><h3>' + esc(name) + '</h3><p><i class="bi bi-geo-alt"></i> ' + esc(shop.location) + '</p>' +
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
      track.innerHTML = shops.map(card).join("");
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