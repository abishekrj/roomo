(() => {
  "use strict";
  const API = "http://localhost:5001/api/listing-display-settings";
  const TOKEN_KEY = "roomoAdminToken";
  const $ = id => document.getElementById(id);
  const notice = (message, type = "info") => {
    const el = $("pageNotice"); el.textContent = message; el.className = "notice show " + type;
  };
  const token = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  async function request(path = "/admin", options = {}) {
    let response;
    try { response = await fetch(API + path, { ...options, headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), Authorization: "Bearer " + token() } }); }
    catch { throw new Error("Cannot connect to ROOMO API. Make sure the backend is running on port 5001."); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.message || "Could not load listing settings."); error.status = response.status; throw error; }
    return data;
  }
  const ids = ["showAccommodationSummary","showBedDetails","showPaymentMessage","showAvailabilityMessage","showLocation","showGuestRating","showDescription"];
  function apply(settings) {
    ids.forEach(id => $(id).checked = Boolean(settings[id]));
    $("paymentMessage").value = settings.paymentMessage || "";
    $("availabilityMessageTemplate").value = settings.availabilityMessageTemplate || "We have {count} left at this price";
  }
  async function load() { const data = await request("/admin"); apply(data.settings || {}); }
  document.addEventListener("DOMContentLoaded", async () => {
    $("logoutButton").addEventListener("click", () => { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); location.href = "admin.html"; });
    $("reloadSettings").addEventListener("click", () => load().catch(error => notice(error.message, "error")));
    $("settingsForm").addEventListener("submit", async event => {
      event.preventDefault();
      const button = $("saveSettings"); button.disabled = true; button.textContent = "Saving…";
      const settings = Object.fromEntries(ids.map(id => [id, $(id).checked]));
      settings.paymentMessage = $("paymentMessage").value.trim();
      settings.availabilityMessageTemplate = $("availabilityMessageTemplate").value.trim();
      try { const data = await request("/admin", { method: "PUT", body: JSON.stringify(settings) }); apply(data.settings); notice(data.message || "Listing display settings saved.", "success"); }
      catch (error) { notice(error.message, "error"); if (error.status === 401 || error.status === 403) setTimeout(() => location.replace("admin.html"), 700); }
      finally { button.disabled = false; button.textContent = "Save listing settings"; }
    });
    if (!token()) { location.replace("admin.html"); return; }
    try { await load(); } catch (error) { notice(error.message, "error"); if (error.status === 401 || error.status === 403) setTimeout(() => location.replace("admin.html"), 700); }
  });
})();