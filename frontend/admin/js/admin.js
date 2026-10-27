(() => {
  "use strict";
  const API = "http://localhost:5001/api";
  const TOKEN_KEY = "roomoAdminToken";
  const $ = (id) => document.getElementById(id);
  let token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  let properties = [];
  let registeredUsers = [];
  let imageItems = [];
  const currentPage = document.body.dataset.page || "dashboard";

  function notice(message, type = "info") {
    const el = $("pageNotice");
    if (!el) return;
    el.textContent = message;
    el.className = `notice show ${type}`;
  }

  async function request(path, options = {}) {
    const headers = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    let response;
    try {
      response = await fetch(`${API}${path}`, { ...options, headers });
    } catch {
      throw new Error("Cannot connect to ROOMO API. Make sure the backend is running on port 5001.");
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || `Request failed (${response.status}).`);
      error.status = response.status;
      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        token = null;
      }
      throw error;
    }
    return data;
  }

  function renderPropertyImages() {
    const manager = $("propertyImageManager");
    if (!manager) return;
    manager.replaceChildren();
    imageItems.forEach((item, index) => {
      const card = document.createElement("div"); card.className = "property-image-item";
      const img = document.createElement("img"); img.alt = "Property image " + (index + 1); img.src = item.previewUrl || item.imageUrl;
      const label = document.createElement("label");
      const radio = document.createElement("input"); radio.type = "radio"; radio.name = "mainPropertyImage"; radio.checked = index === 0;
      radio.addEventListener("change", () => { imageItems = [imageItems[index], ...imageItems.filter((_, i) => i !== index)]; renderPropertyImages(); });
      label.append(radio, document.createTextNode("Main image"));
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "button button-secondary"; remove.textContent = "Remove";
      remove.addEventListener("click", () => { if (item.previewUrl && item.file) URL.revokeObjectURL(item.previewUrl); imageItems.splice(index, 1); renderPropertyImages(); });
      card.append(img, label, remove); manager.appendChild(card);
    });
  }
  function addSelectedImageFiles() {
    const input = $("propertyImages"); const files = Array.from(input?.files || []); if (!files.length) return;
    const remaining = 10 - imageItems.length;
    if (files.length > remaining) notice("A property can have up to 10 images total. You can add " + Math.max(0, remaining) + " more.", "error");
    files.slice(0, Math.max(0, remaining)).forEach(file => {
      if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) { notice("Use JPG, PNG, WebP, or AVIF images only.", "error"); return; }
      if (file.size > 8 * 1024 * 1024) { notice(file.name + " is larger than 8 MB.", "error"); return; }
      imageItems.push({ file: file, previewUrl: URL.createObjectURL(file), imageUrl: "" });
    });
    input.value = ""; renderPropertyImages();
  }
  async function uploadPendingPropertyImages() {
    const pending = imageItems.filter(item => item.file); if (!pending.length) return;
    const form = new FormData(); pending.forEach(item => form.append("images", item.file));
    const response = await fetch(API + "/admin/property-images/upload", { method: "POST", headers: token ? { Authorization: "Bearer " + token } : {}, body: form });
    const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || "Property image upload failed.");
    let uploadedIndex = 0;
    imageItems = imageItems.map(item => {
      if (!item.file) return item;
      const uploaded = data.images && data.images[uploadedIndex++]; if (!uploaded || !uploaded.imageUrl) throw new Error("The server did not return an image URL.");
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl); return { imageUrl: uploaded.imageUrl };
    });
    renderPropertyImages();
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
  }
  function statusBadge(status) {
    const span = document.createElement("span");
    span.className = `status status-${String(status).toLowerCase()}`;
    span.textContent = status;
    return span;
  }
  function cell(row, value) {
    const td = document.createElement("td");
    td.textContent = value == null ? "" : String(value);
    row.appendChild(td);
    return td;
  }
  function propertyCell(row, p) {
    const td = document.createElement("td");
    const title = document.createElement("div");
    title.className = "property-name";
    title.textContent = p.title;
    const loc = document.createElement("div");
    loc.className = "property-location";
    loc.textContent = [p.city, p.state].filter(Boolean).join(", ");
    td.append(title, loc);
    row.appendChild(td);
  }
  async function loadProperties() {
    const result = await request("/admin/properties");
    properties = Array.isArray(result.properties) ? result.properties : [];
    renderPage();
  }
  function renderDashboard() {
    if (!$ ("totalCount")) return;
    $("totalCount").textContent = properties.length;
    $("publishedCount").textContent = properties.filter(p => p.status === "PUBLISHED").length;
    const body = $("recentTableBody");
    if (!body) return;
    body.replaceChildren();
    properties.slice(0, 5).forEach(p => {
      const row = document.createElement("tr");
      propertyCell(row, p);
      cell(row, formatPrice(p.nightlyPrice));
      const td = document.createElement("td");
      td.appendChild(statusBadge(p.status));
      row.appendChild(td);
      body.appendChild(row);
    });
    $("recentEmpty").classList.toggle("hidden", properties.length > 0);
  }

  function renderRooms() {
    const body = $("propertyTableBody");
    if (!body) return;
    body.replaceChildren();
    const query = ($("roomsSearch")?.value || "").trim().toLocaleLowerCase();
    const visibleProperties = properties.filter(p => [p.title, p.city, p.state, p.address, p.propertyType, p.status].some(value => String(value || "").toLocaleLowerCase().includes(query)));
    const empty = $("emptyState");
    if (empty) {
      empty.textContent = properties.length ? "No properties match your search. Clear the search or add a listing." : "No properties yet. Add your first listing above.";
      empty.classList.toggle("hidden", visibleProperties.length > 0);
    }
    if ($("roomsSearchCount")) $("roomsSearchCount").textContent = query ? (visibleProperties.length + " of " + properties.length + " properties found") : (properties.length + " properties");
    visibleProperties.forEach(p => {
      const row = document.createElement("tr");
      propertyCell(row, p);
      cell(row, formatPrice(p.nightlyPrice));
      cell(row, p.maxGuests);
      const featuredCell = cell(row, "");
      const featuredLabel = document.createElement("label");
      featuredLabel.className = "featured-property-toggle";
      const featuredToggle = document.createElement("input");
      featuredToggle.type = "checkbox";
      featuredToggle.checked = Boolean(p.isFeatured);
      featuredToggle.setAttribute("aria-label", "Feature " + p.title + " on the homepage");
      const featuredText = document.createElement("span");
      featuredText.textContent = p.isFeatured ? "Featured" : "Not featured";
      featuredToggle.addEventListener("change", async () => {
        featuredToggle.disabled = true;
        try {
          const result = await request("/admin/properties/" + encodeURIComponent(p.id) + "/featured", {
            method: "PATCH",
            body: JSON.stringify({ isFeatured: featuredToggle.checked, featuredSortOrder: Number(p.featuredSortOrder || 0) })
          });
          p.isFeatured = Boolean(result.property?.isFeatured);
          p.featuredSortOrder = Number(result.property?.featuredSortOrder || 0);
          featuredText.textContent = p.isFeatured ? "Featured" : "Not featured";
          notice(result.message || "Featured selection updated.", "success");
        } catch (error) {
          featuredToggle.checked = Boolean(p.isFeatured);
          notice(error.message, "error");
        } finally {
          featuredToggle.disabled = false;
        }
      });
      featuredLabel.append(featuredToggle, featuredText);
      featuredCell.appendChild(featuredLabel);
      const statusCell = cell(row, "");
      statusCell.appendChild(statusBadge(p.status));
      const statusAction = cell(row, "");
      const select = document.createElement("select");
      select.className = "status-select";
      select.setAttribute("aria-label", "Change status for " + p.title);
      ["DRAFT", "PUBLISHED", "ARCHIVED"].forEach(st => {
        const option = document.createElement("option");
        option.value = st;
        option.textContent = st;
        option.selected = p.status === st;
        select.appendChild(option);
      });
      select.addEventListener("change", async () => {
        const previousStatus = p.status;
        select.disabled = true;
        try {
          await request("/admin/properties/" + encodeURIComponent(p.id) + "/status", { method: "PATCH", body: JSON.stringify({ status: select.value }) });
          notice("Property status updated successfully.", "success");
          await loadProperties();
        } catch (error) {
          notice(error.message, "error");
          select.value = previousStatus;
        } finally {
          select.disabled = false;
        }
      });
      statusAction.appendChild(select);
      const actions = cell(row, "");
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "button button-secondary";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => beginEdit(p));
      actions.appendChild(editButton);
      body.appendChild(row);
    });
  }

  async function loadRegisteredUsers() {
    const result = await request("/admin/registered-users");
    registeredUsers = Array.isArray(result.users) ? result.users : [];
    renderRegisteredUsers();
  }

  function renderRegisteredUsers() {
    const body = $("registeredUsersTableBody");
    if (!body) return;
    body.replaceChildren();
    const query = ($("registeredUsersSearch")?.value || "").trim().toLocaleLowerCase();
    const visibleUsers = registeredUsers.filter(user =>
      [user.fullName, user.email, user.authProvider, user.emailVerified ? "verified" : "pending unverified"].some(value => String(value || "").toLocaleLowerCase().includes(query))
    );
    if ($("registeredUsersCount")) {
      $("registeredUsersCount").textContent = query
        ? visibleUsers.length + " of " + registeredUsers.length + " users"
        : registeredUsers.length + (registeredUsers.length === 1 ? " registered user" : " registered users");
    }
    const empty = $("registeredUsersEmpty");
    if (empty) {
      empty.textContent = registeredUsers.length
        ? "No registered users match your search."
        : "No guest accounts have been registered yet.";
      empty.classList.toggle("hidden", visibleUsers.length > 0);
    }
    visibleUsers.forEach(user => {
      const row = document.createElement("tr");
      cell(row, user.fullName);
      cell(row, user.email);
      const passwordCell = cell(row, "");
      const passwordStatus = document.createElement("span");
      passwordStatus.className = "status " + (user.authProvider === "GOOGLE" ? "status-archived" : "status-published");
      passwordStatus.textContent = user.authProvider === "GOOGLE" ? "Not set (Google sign-in)" : "Stored securely";
      passwordCell.appendChild(passwordStatus);
      const verificationCell = cell(row, "");
      const verificationStatus = document.createElement("span");
      verificationStatus.className = "status " + (user.emailVerified ? "status-published" : "status-draft");
      verificationStatus.textContent = user.emailVerified ? "Verified" : "Pending";
      verificationCell.appendChild(verificationStatus);
      cell(row, user.authProvider === "GOOGLE" ? "Google" : user.authProvider === "EMAIL_GOOGLE" ? "Email & Google" : "Email & password");
      cell(row, user.createdAt ? new Date(user.createdAt).toLocaleString() : "—");
      body.appendChild(row);
    });
  }

  function renderReports() {
    const count = status => properties.filter(p => p.status === status).length;
    const total = properties.length;
    [["reportTotal", total], ["reportPublished", count("PUBLISHED")], ["reportDraft", count("DRAFT")], ["reportArchived", count("ARCHIVED")]].forEach(([id, n]) => {
      if ($(id)) $(id).textContent = n;
    });
    const width = n => `${total ? Math.round(n / total * 100) : 0}%`;
    if ($("reportTotalBar")) $("reportTotalBar").style.width = total ? "100%" : "0%";
    if ($("reportPublishedBar")) $("reportPublishedBar").style.width = width(count("PUBLISHED"));
    if ($("reportDraftBar")) $("reportDraftBar").style.width = width(count("DRAFT"));
    if ($("reportArchivedBar")) $("reportArchivedBar").style.width = width(count("ARCHIVED"));
  }
  function renderPage() {
    if (currentPage === "dashboard") renderDashboard();
    if (currentPage === "rooms") renderRooms();
    if (currentPage === "reports") renderReports();
    if (currentPage === "registered-users") renderRegisteredUsers();
  }

  function fillForm(p) {
    $("title").value = p.title || "";
    $("propertyType").value = p.propertyType || "";
    $("nightlyPrice").value = p.nightlyPrice ?? "";
    $("description").value = p.description || "";
    $("address").value = p.address || "";
    if ($("mapLocation")) $("mapLocation").value = p.mapLocation || "";
    $("city").value = p.city || "";
    $("state").value = p.state || "";
    $("country").value = p.country || "India";
    $("postalCode").value = p.postalCode || "";
    $("maxGuests").value = p.maxGuests ?? 2;
    $("bedrooms").value = p.bedrooms ?? 1;
    $("bathrooms").value = p.bathrooms ?? 1;
    if ($("livingRooms")) $("livingRooms").value = p.livingRooms ?? 1;
    if ($("kitchens")) $("kitchens").value = p.kitchens ?? 1;
    if ($("areaSquareMeters")) $("areaSquareMeters").value = p.areaSquareMeters ?? "";
    if ($("bedConfiguration")) $("bedConfiguration").value = (Array.isArray(p.bedConfiguration) ? p.bedConfiguration : []).map(bed => `${bed.count} ${bed.type}`).join("\n");
    if ($("allowPayAtProperty")) $("allowPayAtProperty").checked = Boolean(p.allowPayAtProperty);
    if ($("noCreditCardRequired")) $("noCreditCardRequired").checked = Boolean(p.noCreditCardRequired);
    if ($("availabilityCount")) $("availabilityCount").value = p.availabilityCount ?? "";
    setCheckedValues("amenities", p.amenities);
    setCheckedValues("nearbyLandmarks", p.nearbyLandmarks);
    $("perks").value = Array.isArray(p.perks) ? p.perks.join("\n") : "";
    $("initialStatus").value = p.status === "ARCHIVED" ? "DRAFT" : (p.status || "DRAFT");
    imageItems.forEach(item => { if (item.previewUrl && item.file) URL.revokeObjectURL(item.previewUrl); });
    imageItems = (Array.isArray(p.images) ? [...p.images].sort((a, b) => a.sortOrder - b.sortOrder).map(image => ({ imageUrl: image.imageUrl })) : []);
    $("imageUrls").value = "";
    $("propertyImages").value = "";
    $("isFeatured").checked = Boolean(p.isFeatured);
    $("featuredSortOrder").value = p.featuredSortOrder ?? 0;
    renderPropertyImages();
  }
  function beginEdit(p) {
    $("editingPropertyId").value = p.id;
    fillForm(p);
    $("propertyFormTitle").textContent = "Edit Property";
    $("propertyFormDescription").textContent = "Update the property details below and save your changes.";
    $("createButton").textContent = "Save changes";
    $("cancelEditButton").classList.remove("hidden");
    $("clearFormButton").classList.add("hidden");
    $("propertyFormPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    $("title").focus({ preventScroll: true });
  }
  function resetPropertyForm() {
    const form = $("propertyForm");
    if (!form) return;
    form.reset();
    $("editingPropertyId").value = "";
    $("propertyFormTitle").textContent = "Add New Property";
    $("propertyFormDescription").textContent = "Save a listing as a draft or publish it immediately.";
    $("createButton").textContent = "Create property";
    $("cancelEditButton").classList.add("hidden");
    $("clearFormButton").classList.remove("hidden");
    $("country").value = "India";
    $("maxGuests").value = 2;
    $("bedrooms").value = 1;
    $("bathrooms").value = 1;
    if ($("livingRooms")) $("livingRooms").value = 1;
    if ($("kitchens")) $("kitchens").value = 1;
    if ($("areaSquareMeters")) $("areaSquareMeters").value = "";
    if ($("bedConfiguration")) $("bedConfiguration").value = "";
    if ($("allowPayAtProperty")) $("allowPayAtProperty").checked = false;
    if ($("noCreditCardRequired")) $("noCreditCardRequired").checked = false;
    if ($("availabilityCount")) $("availabilityCount").value = "";
    setCheckedValues("amenities", [
      "wifi",
      "airport-shuttle",
      "family-rooms",
      "non-smoking-rooms",
      "front-desk-24h",
      "lift",
      "heating",
      "ac"
    ]);
    setCheckedValues("nearbyLandmarks", []);
    $("perks").value = "";
    $("initialStatus").value = "PUBLISHED";
    imageItems.forEach(item => { if (item.previewUrl && item.file) URL.revokeObjectURL(item.previewUrl); });
    imageItems = [];
    if ($("propertyImages")) $("propertyImages").value = "";
    if ($("imageUrls")) $("imageUrls").value = "";
    if ($("isFeatured")) $("isFeatured").checked = false;
    if ($("featuredSortOrder")) $("featuredSortOrder").value = 0;
    renderPropertyImages();
  }
  function setCheckedValues(name, values) {
    const selected = new Set(Array.isArray(values) ? values : []);
    document.querySelectorAll(`input[name="${name}"]`).forEach(input => { input.checked = selected.has(input.value); });
  }

  // The same popular facility can appear in the badge selector and its detailed category.
  document.addEventListener("change", event => {
    const input = event.target;
    if (!input.matches('input[name="amenities"]')) return;
    document.querySelectorAll('input[name="amenities"][value="' + CSS.escape(input.value) + '"]').forEach(other => { if (other !== input) other.checked = input.checked; });
  });

  function collectPropertyPayload() {
    const urlImages = $("imageUrls").value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    const imageUrls = [...imageItems.map(item => item.imageUrl).filter(Boolean), ...urlImages];
    if (imageUrls.length + imageItems.filter(item => item.file).length > 10) throw new Error("Please use no more than 10 images per property.");
    for (const url of urlImages) {
      let parsed;
      try { parsed = new URL(url); } catch { throw new Error("Invalid image URL: " + url); }
      if (parsed.protocol !== "https:") throw new Error("Image URLs must use HTTPS.");
    }
    return {
      title: $("title").value.trim(),
      propertyType: $("propertyType").value,
      nightlyPrice: Number($("nightlyPrice").value),
      description: $("description").value.trim(),
      address: $("address").value.trim(),
      mapLocation: $("mapLocation")?.value.trim() || null,
      city: $("city").value.trim(),
      state: $("state").value.trim(),
      country: $("country").value.trim(),
      postalCode: $("postalCode").value.trim() || null,
      maxGuests: Number($("maxGuests").value),
      bedrooms: Number($("bedrooms").value),
      bathrooms: Number($("bathrooms").value),
      livingRooms: Number($("livingRooms")?.value || 0),
      kitchens: Number($("kitchens")?.value || 0),
      areaSquareMeters: $("areaSquareMeters")?.value ? Number($("areaSquareMeters").value) : null,
      bedConfiguration: ($("bedConfiguration")?.value || "").split(/\r?\n/).map(line => { const match = line.trim().match(/^(\d+)\s+(.+)$/); return match ? { count: Number(match[1]), type: match[2].trim() } : null; }).filter(Boolean),
      allowPayAtProperty: Boolean($("allowPayAtProperty")?.checked),
      noCreditCardRequired: Boolean($("noCreditCardRequired")?.checked),
      availabilityCount: $("availabilityCount")?.value !== "" && $("availabilityCount")?.value != null ? Number($("availabilityCount").value) : null,
      amenities: Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(input => input.value),
      nearbyLandmarks: Array.from(document.querySelectorAll('input[name="nearbyLandmarks"]:checked')).map(input => input.value),
      perks: $("perks").value.split(/\r?\n/).map(value => value.trim()).filter(Boolean).slice(0, 8),
      imageUrls,
      isFeatured: $("isFeatured").checked,
      featuredSortOrder: Number($("featuredSortOrder").value || 0),
      status: $("initialStatus").value
    };
  }

  async function init() {
    const logout = $("logoutButton");
    if (logout) logout.addEventListener("click", () => {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      token = null;
      location.href = "admin.html";
    });

    if (currentPage === "login") {
      const form = $("loginForm");
      form.addEventListener("submit", async event => {
        event.preventDefault();
        const button = $("loginButton");
        button.disabled = true;
        button.textContent = "Signing in…";
        try {
          const result = await request("/auth/login", { method: "POST", body: JSON.stringify({ email: $("loginEmail").value.trim(), password: $("loginPassword").value }) });
          if (!result.token) throw new Error("Login response did not include a token.");
          if (result.owner?.role !== "ADMIN") {
            throw new Error("This account does not have administrator access. Ask an administrator to set its database role to ADMIN.");
          }
          token = result.token;
          localStorage.setItem(TOKEN_KEY, token);
          sessionStorage.removeItem(TOKEN_KEY);
          await request("/admin/properties");
          location.href = "dashboard.html";
        } catch (error) {
          notice(error.message, "error");
        } finally {
          button.disabled = false;
          button.textContent = "Sign in to dashboard";
        }
      });
      return;
    }

    if (!token) { location.replace("admin.html"); return; }
    try {
      if (currentPage === "registered-users") await loadRegisteredUsers();
      else await loadProperties();
    }
    catch (error) {
      notice(error.message, "error");
      if (error.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        token = null;
        setTimeout(() => location.replace("admin.html"), 700);
      }
    }

    if ($("roomsSearch")) $("roomsSearch").addEventListener("input", renderRooms);
    if ($("registeredUsersSearch")) $("registeredUsersSearch").addEventListener("input", renderRegisteredUsers);

    const refresh = $("refreshButton") || $("reportsRefreshButton") || $("registeredUsersRefreshButton");
    if (refresh) refresh.addEventListener("click", async () => {
      refresh.disabled = true;
      try {
        if (currentPage === "registered-users") await loadRegisteredUsers();
        else await loadProperties();
        notice("Data refreshed.", "success");
      }
      catch (error) { notice(error.message, "error"); }
      finally { refresh.disabled = false; }
    });
    const add = $("addPropertyButton"), panel = $("propertyFormPanel");
    if (add && panel) add.addEventListener("click", () => { resetPropertyForm(); panel.scrollIntoView({ behavior: "smooth", block: "start" }); });
    if ($("cancelEditButton")) $("cancelEditButton").addEventListener("click", resetPropertyForm);
    if ($("propertyImages")) $("propertyImages").addEventListener("change", addSelectedImageFiles);
    const form = $("propertyForm");
    if (form) {
      form.addEventListener("reset", () => {
        // Native form reset is retained for the Add New Property flow.
      });
      form.addEventListener("submit", async event => {
        event.preventDefault();
        const button = $("createButton");
        const editingId = $("editingPropertyId").value;
        button.disabled = true;
        button.textContent = editingId ? "Saving changes…" : "Creating property…";
        try {
          await uploadPendingPropertyImages();
          const payload = collectPropertyPayload();
          payload.imageUrls = [...imageItems.map(item => item.imageUrl).filter(Boolean), ...payload.imageUrls.filter(url => !imageItems.some(item => item.imageUrl === url))];
          const path = editingId ? `/admin/properties/${encodeURIComponent(editingId)}` : "/admin/properties";
          const method = editingId ? "PATCH" : "POST";
          await request(path, { method, body: JSON.stringify(payload) });
          resetPropertyForm();
          notice(editingId ? "Property updated successfully." : "Property created successfully.", "success");
          await loadProperties();
        } catch (error) {
          notice(error.message, "error");
        } finally {
          button.disabled = false;
          button.textContent = $("editingPropertyId").value ? "Save changes" : "Create property";
        }
      });
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();
