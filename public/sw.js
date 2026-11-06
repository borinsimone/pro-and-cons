const scope = new URL(self.registration.scope);
const prefix = "a-mente:" + scope.pathname + ":";
const cacheName = prefix + "v1";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const page = await fetch(scope, { cache: "reload" });
    if (!page.ok) throw new Error("App shell unavailable");
    const html = await page.clone().text();
    const assets = new Set();
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const url = new URL(match[1], scope);
      if (url.origin === scope.origin && url.pathname.startsWith(scope.pathname + "_next/static/")) {
        assets.add(url.href);
      }
    }
    const cache = await caches.open(cacheName);
    await cache.addAll([...assets]);
    await cache.put(scope.href, page);
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(prefix) && key !== cacheName).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  if (request.mode === "navigate" && url.pathname === scope.pathname) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) await (await caches.open(cacheName)).put(scope.href, response.clone()).catch(() => {});
        return response;
      } catch {
        return (await caches.match(scope.href, { cacheName })) ?? Response.error();
      }
    })());
  } else if (url.pathname.startsWith(scope.pathname + "_next/static/")) {
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      const stored = await cache.match(request);
      if (stored) return stored;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone()).catch(() => {});
      return response;
    })());
  }
});
