(() => {
  "use strict";
  const API = "http://localhost:5001/api/homepage";
  const FOOTER_URL = "components/footer.html";
  const defaults = {
    social: [{label:"Facebook",url:"#",icon:"bi-facebook"},{label:"Instagram",url:"#",icon:"bi-instagram"},{label:"WhatsApp",url:"https://wa.me/919444000000",icon:"bi-whatsapp"},{label:"YouTube",url:"#",icon:"bi-youtube"}],
    sanctuaries: [{label:"Ashrams & Meditation Kutir",url:"index.html#popularStays"},{label:"Heritage Haveli Courtyards",url:"index.html#popularStays"},{label:"Temple Gopuram View Suites",url:"index.html#popularStays"},{label:"Girivalam Pradakshina Inns",url:"index.html#popularStays"},{label:"Sattvic Homestays",url:"index.html#popularStays"}],
    pilgrimCare: [{label:"Karthigai Deepam 2026 Passes",url:"index.html#karthigaiPromo"},{label:"Pournami Girivalam Calendar",url:"index.html#spiritualGuide"},{label:"Annamalaiyar Darshan Timings",url:"index.html#spiritualGuide"},{label:"Ashram Taxi & Station Pickups",url:"#"}],
    legal: [{label:"Pilgrim Code of Conduct",url:"#"},{label:"Privacy Terms",url:"#"},{label:"Host an Ashram or Haveli",url:"roomo-signup.html"}]
  };
  const safeUrl = value => /^javascript:/i.test(String(value || "")) ? "#" : String(value || "#").trim();
  const makeLink = (item, className = "footer-link") => {
    const a = document.createElement("a");
    a.className = className;
    a.href = safeUrl(item.url);
    a.textContent = item.label || "Link";
    if (/^https?:\/\//i.test(a.href) && new URL(a.href).origin !== location.origin) a.rel = "noopener noreferrer";
    return a;
  };
  const renderList = (ul, items) => {
    if (!ul || !Array.isArray(items)) return;
    ul.replaceChildren();
    items.forEach(item => { const li = document.createElement("li"); li.appendChild(makeLink(item)); ul.appendChild(li); });
  };
  function apply(content) {
    const footer = document.querySelector("footer.temple-granite-footer");
    if (!footer) return;
    const links = {...defaults, ...(content.footerLinks || {})};
    const columns = footer.querySelectorAll(".row.g-4.mb-4 > div");
    if (columns[0]) {
      const social = columns[0].querySelector(".d-flex.gap-3.fs-5.mt-3");
      if (social) {
        social.replaceChildren();
        (links.social || []).forEach(item => {
          const a = makeLink(item); a.target = "_blank"; a.rel = "noopener noreferrer"; a.setAttribute("aria-label", item.label || "Social media");
          const icon = document.createElement("i");
          icon.className = "bi " + (/^[a-z0-9-]+$/i.test(item.icon || "") ? item.icon : "bi-link-45deg");
          a.appendChild(icon); social.appendChild(a);
        });
      }
      const description = columns[0].querySelector("p");
      if (description && content.footerDescription) description.textContent = content.footerDescription;
    }
    if (columns[1]) renderList(columns[1].querySelector("ul"), links.sanctuaries);
    if (columns[2]) renderList(columns[2].querySelector("ul"), links.pilgrimCare);
    const legal = footer.querySelector(".d-flex.flex-column.flex-md-row.align-items-center.justify-content-between > div");
    if (legal) { legal.replaceChildren(); (links.legal || []).forEach(item => legal.appendChild(makeLink(item))); }

  }
  async function updateVisitorCount() {
    const container = document.getElementById("visitorCountContainer");
    const value = document.getElementById("visitorCountValue");
    if (!container || !value) return;
    try {
      const alreadyCounted = sessionStorage.getItem("roomoVisitorCounted") === "1";
      const response = await fetch(API + (alreadyCounted ? "/visitor-count" : "/visitor-count/visit"), {
        method: alreadyCounted ? "GET" : "POST",
        cache: "no-store"
      });
      if (!response.ok) throw new Error("Visitor count request failed.");
      const stats = await response.json();
      if (!alreadyCounted) sessionStorage.setItem("roomoVisitorCounted", "1");
      container.hidden = stats.visible === false;
      value.textContent = "Visitors: " + Number(stats.count || 0).toLocaleString("en-IN");
    } catch (error) {
      container.hidden = true;
      console.warn("ROOMO visitor count is temporarily unavailable.", error);
    }
  }
  document.addEventListener("DOMContentLoaded", async () => {
    const placeholder = document.getElementById("roomoFooter");
    if (!placeholder) return;
    try {
      const component = await fetch(FOOTER_URL, {cache:"no-cache"});
      if (!component.ok) throw new Error("Footer component returned HTTP " + component.status);
      placeholder.outerHTML = await component.text();
      await updateVisitorCount();
      try {
        const response = await fetch(API, {cache:"no-store"});
        if (response.ok) { const data = await response.json(); apply(data.content || {}); }
      } catch (error) { console.warn("ROOMO footer settings unavailable; showing default footer links.", error); }
    } catch (error) {
      console.error("ROOMO shared footer could not load.", error);
    }
  });
})();