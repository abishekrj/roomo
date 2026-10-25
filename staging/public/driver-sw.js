self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch {}
  const title = payload.title || "ROOMO · New trip request";
  const options = {
    body: payload.body || "A transport request is waiting for your response.",
    icon: "/staging/favicon.ico",
    badge: "/staging/favicon.ico",
    tag: payload.bookingCode || "roomo-driver-trip",
    renotify: true,
    data: { url: payload.url || "/staging/driver/dashboard" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/staging/driver/dashboard", self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(windowClients => {
    for (const client of windowClients) {
      if (client.url.startsWith(self.location.origin + "/staging/driver") && "focus" in client) {
        client.navigate(target);
        return client.focus();
      }
    }
    return clients.openWindow(target);
  }));
});
