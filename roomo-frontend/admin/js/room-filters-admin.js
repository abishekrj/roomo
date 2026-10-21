(() => {
  "use strict";
  const API = "http://localhost:5001/api/admin/room-filters";
  const TOKEN_KEY = "roomoAdminToken";
  const $ = id => document.getElementById(id);
  let token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  let groups = [];

  function notice(message, type = "info") {
    const el = $("pageNotice");
    if (!el) return;
    el.textContent = message;
    el.className = "notice show " + type;
  }

  async function request(path = "", options = {}) {
    let response;
    try {
      response = await fetch(API + path, {
        ...options,
        headers: {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: "Bearer " + token } : {})
        }
      });
    } catch {
      throw new Error("Cannot connect to ROOMO API. Make sure the backend is running on port 5001.");
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || "The request could not be completed.");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function actionButton(label, action, disabled = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button-secondary";
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener("click", action);
    return button;
  }

  function updateGroupSelect() {
    const select = $("filterGroup");
    const previous = select.value;
    select.replaceChildren();
    const active = groups.filter(group => group.isActive);
    if (!active.length) {
      const option = new Option("Create and enable a subheading first", "");
      select.add(option);
      select.disabled = true;
      return;
    }
    select.disabled = false;
    active.forEach(group => select.add(new Option(group.title, group.id)));
    if (active.some(group => group.id === previous)) select.value = previous;
  }

  function renderGroups() {
    updateGroupSelect();
    const list = $("filterGroupsList");
    list.replaceChildren();
    if (!groups.length) {
      list.appendChild(Object.assign(document.createElement("p"), { className: "filter-empty", textContent: "No subheadings yet. Add your first subheading above." }));
      return;
    }
    groups.forEach(group => {
      const card = document.createElement("section");
      card.className = "filter-group-card";
      const head = document.createElement("div");
      head.className = "filter-group-heading";
      const heading = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = (group.icon ? "◈ " : "") + group.title;
      const meta = document.createElement("small");
      meta.textContent = "Order " + group.sortOrder + " · " + (group.isActive ? "Visible on listing page" : "Disabled");
      heading.append(title, meta);
      const actions = document.createElement("div");
      actions.className = "filter-admin-actions";
      actions.append(
        actionButton("Edit", () => editGroup(group)),
        actionButton(group.isActive ? "Disable" : "Enable", () => saveGroup(group, { isActive: !group.isActive })),
        actionButton("Delete", () => deleteGroup(group))
      );
      head.append(heading, actions);
      card.appendChild(head);

      const filters = group.filters || [];
      if (!filters.length) {
        const empty = document.createElement("div");
        empty.className = "filter-empty";
        empty.textContent = "No filters under this subheading yet. Use the Add filter form above.";
        card.appendChild(empty);
      }
      filters.forEach(filter => {
        const row = document.createElement("div");
        row.className = "filter-option-row" + (filter.isActive ? "" : " is-disabled");
        const detail = document.createElement("div");
        const label = document.createElement("strong");
        label.textContent = filter.label;
        const meta = document.createElement("small");
        meta.textContent = "Type: " + filter.filterType + " · Value: " + filter.value + " · Order " + filter.sortOrder + (filter.isActive ? "" : " · Disabled");
        detail.append(label, meta);
        const rowActions = document.createElement("div");
        rowActions.className = "filter-admin-actions";
        rowActions.append(
          actionButton("Edit", () => editFilter(group, filter)),
          actionButton(filter.isActive ? "Disable" : "Enable", () => saveFilter(filter, { isActive: !filter.isActive })),
          actionButton("Delete", () => deleteFilter(filter))
        );
        row.append(detail, rowActions);
        card.appendChild(row);
      });
      list.appendChild(card);
    });
  }

  async function loadGroups() {
    const data = await request();
    groups = data.groups || [];
    renderGroups();
  }

  async function saveGroup(group, changes) {
    try {
      await request("/groups/" + encodeURIComponent(group.id), { method: "PATCH", body: JSON.stringify(changes) });
      await loadGroups();
      notice("Subheading updated.", "success");
    } catch (error) { notice(error.message, "error"); }
  }

  async function editGroup(group) {
    const title = prompt("Subheading title", group.title);
    if (title === null) return;
    const icon = prompt("Bootstrap icon class (for example bi-stars)", group.icon || "bi-sliders");
    if (icon === null) return;
    const orderText = prompt("Display order (smaller numbers appear first)", String(group.sortOrder));
    if (orderText === null) return;
    const sortOrder = Number(orderText);
    if (!title.trim() || !Number.isInteger(sortOrder) || sortOrder < 0) return notice("Enter a title and a non-negative whole-number order.", "error");
    await saveGroup(group, { title: title.trim(), icon: icon.trim() || "bi-sliders", sortOrder });
  }

  async function deleteGroup(group) {
    if (!confirm('Delete the subheading "' + group.title + '" and all its filters?')) return;
    try {
      await request("/groups/" + encodeURIComponent(group.id), { method: "DELETE" });
      await loadGroups();
      notice("Subheading and its filters deleted.", "success");
    } catch (error) { notice(error.message, "error"); }
  }

  async function saveFilter(filter, changes) {
    try {
      await request("/filters/" + encodeURIComponent(filter.id), { method: "PATCH", body: JSON.stringify(changes) });
      await loadGroups();
      notice("Filter updated.", "success");
    } catch (error) { notice(error.message, "error"); }
  }

  async function editFilter(group, filter) {
    const label = prompt("Filter label", filter.label);
    if (label === null) return;
    const filterType = prompt("Filter type: type, rating, amenity, distance, room, keyword", filter.filterType);
    if (filterType === null) return;
    const value = prompt("Filter value used by the search logic", filter.value);
    if (value === null) return;
    const sortText = prompt("Display order (smaller numbers appear first)", String(filter.sortOrder));
    if (sortText === null) return;
    const allowed = ["type", "rating", "amenity", "distance", "room", "keyword"];
    const sortOrder = Number(sortText);
    if (!label.trim() || !value.trim() || !allowed.includes(filterType.trim()) || !Number.isInteger(sortOrder) || sortOrder < 0) {
      return notice("Check the label, supported filter type, value, and order.", "error");
    }
    await saveFilter(filter, { groupId: group.id, label: label.trim(), filterType: filterType.trim(), value: value.trim(), sortOrder });
  }

  async function deleteFilter(filter) {
    if (!confirm('Delete the filter "' + filter.label + '"?')) return;
    try {
      await request("/filters/" + encodeURIComponent(filter.id), { method: "DELETE" });
      await loadGroups();
      notice("Filter deleted.", "success");
    } catch (error) { notice(error.message, "error"); }
  }

  async function init() {
    if (!token) return location.replace("admin.html");
    $("logoutButton").addEventListener("click", () => {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      location.href = "admin.html";
    });
    $("refreshFilters").addEventListener("click", async () => {
      try { await loadGroups(); notice("Room filters refreshed.", "success"); }
      catch (error) { notice(error.message, "error"); }
    });
    $("groupForm").addEventListener("submit", async event => {
      event.preventDefault();
      const button = event.submitter;
      button.disabled = true;
      try {
        const data = await request("/groups", { method: "POST", body: JSON.stringify({
          title: $("groupTitle").value.trim(),
          icon: $("groupIcon").value.trim() || "bi-sliders",
          sortOrder: Number($("groupOrder").value),
          isActive: true
        }) });
        $("groupForm").reset();
        $("groupIcon").value = "bi-stars";
        $("groupOrder").value = String((groups.reduce((max, item) => Math.max(max, item.sortOrder), 0) || 0) + 1);
        await loadGroups();
        $("filterGroup").value = data.group.id;
        notice("Subheading created. You can now add filters to it.", "success");
      } catch (error) { notice(error.message, "error"); }
      finally { button.disabled = false; }
    });
    $("filterForm").addEventListener("submit", async event => {
      event.preventDefault();
      const button = event.submitter;
      button.disabled = true;
      try {
        await request("/filters", { method: "POST", body: JSON.stringify({
          groupId: $("filterGroup").value,
          label: $("filterLabel").value.trim(),
          filterType: $("filterType").value,
          value: $("filterValue").value.trim(),
          sortOrder: Number($("filterOrder").value),
          isActive: true
        }) });
        $("filterLabel").value = "";
        $("filterValue").value = "";
        $("filterOrder").value = "0";
        await loadGroups();
        notice("Filter added to its subheading.", "success");
      } catch (error) { notice(error.message, "error"); }
      finally { button.disabled = false; }
    });
    try {
      await loadGroups();
      $("groupOrder").value = String((groups.reduce((max, item) => Math.max(max, item.sortOrder), 0) || 0) + 1);
    } catch (error) {
      notice(error.message, "error");
      if (error.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        setTimeout(() => location.replace("admin.html"), 700);
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
