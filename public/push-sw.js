// LootBoxx Web Push Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "LootBoxx", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "LootBoxx";
  const options = {
    body: data.body || data.message || "",
    icon: data.icon || "/og-image.svg",
    badge: data.badge || "/og-image.svg",
    tag: data.tag || "lootboxx-notif",
    data: { url: data.url || "/dashboard" },
    vibrate: [120, 60, 120],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) {
          c.navigate(url).catch(() => {});
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
