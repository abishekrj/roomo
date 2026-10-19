(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", async () => {
    const placeholder = document.getElementById("roomoHeader");
    if (!placeholder) return;
    try {
      const response = await fetch("components/header.html", { cache: "no-cache" });
      if (!response.ok) throw new Error("Header component returned HTTP " + response.status);
      placeholder.outerHTML = await response.text();
    } catch (error) {
      console.error("ROOMO shared header could not load.", error);
    }
  });
})();
