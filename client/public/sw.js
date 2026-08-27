const CACHE = "streamwise-shell-v1";
const APP_SHELL = ["/", "/manifest.webmanifest", "/favicon.svg"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(async () => (await caches.match(event.request)) || (event.request.mode === "navigate" ? caches.match("/") : Response.error())));
});
self.addEventListener("push", event => {
  let payload = { title: "Streamwise update", body: "Open Streamwise to review your saved alerts.", url: "/updates" };
  try { payload = { ...payload, ...(event.data ? event.data.json() : {}) }; } catch { /* no payload */ }
  event.waitUntil(self.registration.showNotification(payload.title, { body: payload.body, icon: "/favicon.svg", badge: "/favicon.svg", data: { url: payload.url } }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => clients.find(client => client.url.includes(self.location.origin) && "focus" in client)?.focus() || self.clients.openWindow(event.notification.data?.url || "/updates")));
});
