/* Load the shared favicon component into every page head. */
(function () {
  const script = document.currentScript;
  if (!script || !document.head) return;

  const scriptUrl = new URL(script.src, window.location.href);
  const frontendRoot = new URL("../", scriptUrl);
  const componentUrl = new URL("components/favicon.html", frontendRoot);

  fetch(componentUrl.href)
    .then((response) => {
      if (!response.ok) throw new Error("Unable to load shared favicon component");
      return response.text();
    })
    .then((markup) => {
      const template = document.createElement("template");
      template.innerHTML = markup;
      document.head.appendChild(template.content);
    })
    .catch((error) => console.error("ROOMO favicon:", error));
})();
