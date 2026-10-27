(() => {
  "use strict";
  const API = "http://localhost:5001/api";
  const componentUrl = new URL("../components/gallery.html", document.currentScript.src);
  const state = { type: "IMAGE", items: [], index: 0, modal: null };
  const $ = id => document.getElementById(id);
  const safeText = value => String(value || "");
  const escapeHtml = value => safeText(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
  function youtubeId(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.split("/").filter(Boolean)[0] || "";
      if (u.hostname.includes("youtube.com") || u.hostname.includes("youtube-nocookie.com")) {
        if (u.pathname === "/watch") return u.searchParams.get("v") || "";
        const match = u.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/);
        return match ? match[1] : "";
      }
    } catch (_) {}
    return "";
  }
  function previewUrl(item) {
    if (item.type === "IMAGE") return item.mediaUrl;
    if (item.thumbnailUrl) return item.thumbnailUrl;
    if (item.sourceType === "YOUTUBE") {
      const id = youtubeId(item.mediaUrl);
      if (id) return "https://img.youtube.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg";
    }
    return "";
  }
  function renderGrid() {
    const grid = $("galleryGrid");
    if (!grid) return;
    const items = state.items.filter(item => item.type === state.type);
    grid.innerHTML = "";
    if (!items.length) {
      grid.innerHTML = '<div class="col-12"><div class="text-center py-5 text-muted">No ' + (state.type === "IMAGE" ? "images" : "videos") + ' have been published yet.</div></div>';
      return;
    }
    items.forEach((item, index) => {
      const thumb = previewUrl(item);
      const col = document.createElement("div");
      col.className = "col-6 col-md-6 col-lg-4 col-xl-3";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-card-button";
      button.setAttribute("aria-label", "Open " + safeText(item.title));
      button.innerHTML = (thumb ? '<img loading="lazy" alt="' + escapeHtml(item.title) + '" src="' + escapeHtml(thumb) + '">' : (item.type === "VIDEO" ? '<div class="w-100 h-100 d-flex align-items-center justify-content-center text-white"><i class="bi bi-film" style="font-size:4rem"></i></div>' : '<div class="w-100 h-100 d-flex align-items-center justify-content-center text-white"><span class="small">Image preview unavailable</span></div>')) +
        (item.type === "VIDEO" ? '<span class="gallery-card-play"><i class="bi bi-play-circle-fill"></i></span>' : '') +
        '<span class="gallery-card-shade"><strong class="fs-5">' + escapeHtml(item.title) + '</strong><span class="small text-white-50">' + escapeHtml(item.description) + '</span></span>';
      button.addEventListener("click", () => openViewer(index));
      col.appendChild(button);
      grid.appendChild(col);
    });
  }
  function activeItems() { return state.items.filter(item => item.type === state.type); }
  function renderViewer(scrollThumb = true) {
    const items = activeItems();
    if (!items.length) return;
    const item = items[state.index];
    const media = $("lightboxMedia");
    const title = $("lightboxTitle");
    const desc = $("lightboxDesc");
    const counter = $("lightboxCounter");
    if (!media) return;
    if (item.type === "IMAGE") {
      media.innerHTML = '<img alt="' + escapeHtml(item.title) + '" src="' + escapeHtml(item.mediaUrl) + '">';
    } else if (item.sourceType === "YOUTUBE") {
      const id = youtubeId(item.mediaUrl);
      media.innerHTML = id ? '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0" title="' + escapeHtml(item.title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>' : '<p class="p-4 text-white">This YouTube URL is not valid.</p>';
    } else {
      media.innerHTML = '<video controls autoplay playsinline preload="metadata"><source src="' + escapeHtml(item.mediaUrl) + '">Your browser does not support this video.</video>';
      const video = media.querySelector("video");
      if (video) video.play().catch(() => {});
    }
    const caption = $("lightboxCaption");
    if (caption) caption.hidden = item.type === "VIDEO";
    if (title) title.textContent = item.title || "";
    if (desc) desc.textContent = item.description || "";
    if (counter) counter.textContent = (state.index + 1) + " / " + items.length;
    const disabled = items.length < 2;
    $("galleryPrevious").disabled = disabled;
    $("galleryNext").disabled = disabled;
    const thumbs = $("galleryViewerThumbnails");
    if (thumbs) {
      thumbs.querySelectorAll("[data-gallery-thumb-index]").forEach(button => {
        const active = Number(button.dataset.galleryThumbIndex) === state.index;
        button.classList.toggle("active", active);
        button.setAttribute("aria-current", active ? "true" : "false");
      });
      if (scrollThumb) thumbs.querySelector('[data-gallery-thumb-index="' + state.index + '"]')?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }
  function openViewer(index) {
    const items = activeItems();
    if (!items.length) return;
    state.index = index;
    const modal = $("galleryLightboxModal");
    const thumbs = $("galleryViewerThumbnails");
    if (!modal || !thumbs) return;
    thumbs.innerHTML = items.map((item, i) => {
      const preview = previewUrl(item);
      const fallback = item.type === "VIDEO" ? '<span class="gallery-home-thumb-fallback"><i class="bi bi-play-circle"></i></span>' : "";
      return '<button type="button" class="property-gallery-thumb' + (i === state.index ? ' active' : '') + '" data-gallery-thumb-index="' + i + '" aria-label="Show ' + (item.type === "IMAGE" ? "image " : "video ") + (i + 1) + '">' + (preview ? '<img loading="lazy" src="' + escapeHtml(preview) + '" alt="' + escapeHtml(item.title) + ' thumbnail">' : fallback) + '</button>';
    }).join("");
    thumbs.querySelectorAll("[data-gallery-thumb-index]").forEach(button => button.addEventListener("click", () => {
      state.index = Number(button.dataset.galleryThumbIndex);
      renderViewer();
    }));
    modal.hidden = false;
    document.body.classList.add("property-gallery-open");
    renderViewer();
    $("galleryViewerClose").focus();
  }
  function closeViewer() {
    const modal = $("galleryLightboxModal");
    if (!modal) return;
    modal.hidden = true;
    $("lightboxMedia").innerHTML = "";
    document.body.classList.remove("property-gallery-open");
  }
  function step(delta) {
    const items = activeItems();
    if (!items.length) return;
    state.index = (state.index + delta + items.length) % items.length;
    renderViewer();
  }
  function selectTab(type) {
    state.type = type;
    document.querySelectorAll("[data-gallery-type]").forEach(button => {
      const active = button.dataset.galleryType === type;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    renderGrid();
  }
  async function load() {
    try {
      const response = await fetch(API + "/gallery", { cache: "no-store" });
      if (!response.ok) throw new Error("Gallery request failed.");
      const data = await response.json();
      state.items = Array.isArray(data.items) ? data.items : [];
      renderGrid();
    } catch (error) {
      const grid = $("galleryGrid");
      if (grid) grid.innerHTML = '<div class="col-12"><p class="text-center text-muted py-5">Visual Archives are temporarily unavailable. Please try again later.</p></div>';
      console.error("ROOMO gallery could not load.", error);
    }
  }
  async function init() {
    const host = $("roomoGallery");
    if (!host) return;
    try {
      const response = await fetch(componentUrl);
      if (!response.ok) throw new Error("Gallery component could not be loaded.");
      host.innerHTML = await response.text();
    } catch (error) {
      console.error(error);
      return;
    }
    document.querySelectorAll("[data-gallery-type]").forEach(button => button.addEventListener("click", () => selectTab(button.dataset.galleryType)));
    $("galleryPrevious").addEventListener("click", () => step(-1));
    $("galleryNext").addEventListener("click", () => step(1));
    $("galleryViewerClose").addEventListener("click", closeViewer);
    $("galleryThumbPrev").addEventListener("click", () => $("galleryViewerThumbnails").scrollBy({ left: -Math.max(180, $("galleryViewerThumbnails").clientWidth * .7), behavior: "smooth" }));
    $("galleryThumbNext").addEventListener("click", () => $("galleryViewerThumbnails").scrollBy({ left: Math.max(180, $("galleryViewerThumbnails").clientWidth * .7), behavior: "smooth" }));
    $("galleryLightboxModal").addEventListener("click", event => { if (event.target === $("galleryLightboxModal")) closeViewer(); });
    document.addEventListener("keydown", event => {
      const modalEl = $("galleryLightboxModal");
      if (!modalEl || modalEl.hidden) return;
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });
    await load();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();