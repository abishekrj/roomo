(() => {
  "use strict";
  const API = "http://localhost:5001/api/room-filters";
  const container = document.getElementById("filterGroupsContainer");
  if (!container) return;

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function renderGroups(groups) {
    const fragment = document.createDocumentFragment();
    groups.forEach(group => {
      const filters = (group.filters || []).filter(item => item.isActive !== false);
      if (!filters.length) return;
      const section = make("section", "section room-filter-group");
      const heading = make("h3");
      const title = make("span", "", group.title);
      const icon = document.createElement("i");
      const iconName = /^[a-z0-9-]+$/.test(group.icon || "") ? group.icon : "bi-sliders";
      icon.className = "bi " + iconName;
      heading.append(title, document.createTextNode(" "), icon);
      section.appendChild(heading);

      filters.forEach(item => {
        const label = make("label", "check");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = item.filterType;
        input.value = item.value;
        input.dataset.roomFilterId = item.id;
        label.append(input, document.createTextNode(" " + item.label));
        section.appendChild(label);
      });
      fragment.appendChild(section);
    });
    container.replaceChildren(fragment);
    window.renderRoomoListings?.();
  }

  fetch(API, { headers: { Accept: "application/json" } })
    .then(response => {
      if (!response.ok) throw new Error("Room filters could not be loaded.");
      return response.json();
    })
    .then(data => {
      if (Array.isArray(data.groups)) renderGroups(data.groups);
    })
    .catch(error => {
      console.warn("ROOMO is using the built-in filter list because the managed filters could not be loaded.", error);
    });
})();
