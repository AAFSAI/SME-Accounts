self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.open("sme-accounts-v1").then(async (cache) => {
      const cached = await cache.match(event.request);

      if (cached) {
        return cached;
      }

      const response = await fetch(event.request);
      cache.put(event.request, response.clone());
      return response;
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
