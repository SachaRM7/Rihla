importScripts("/offline-precache.js", "/offline-worker.js");

const offline = self.RihlaOffline;
const shellCache = `${offline.shellPrefix}${self.RIHLA_PRECACHE.version}`;
const staticPaths = new Set(self.RIHLA_PRECACHE.assets);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(shellCache);
    try {
      // The root document is public. Never cache an account page or URL carrying an auth code.
      await cache.addAll(["/", ...staticPaths].map((url) => new Request(url, { credentials: "omit", cache: "reload", redirect: "error" })));
    } catch (error) {
      await caches.delete(shellCache);
      throw error;
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(offline.shellPrefix) && name !== shellCache) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!/^https?:$/.test(url.protocol)) return;
  if (request.mode === "navigate") {
    if (!offline.isPublicNavigation(url, self.location.origin)) return;
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch {
        return await (await caches.open(shellCache)).match("/")
          ?? new Response("RIHLA n’est pas encore disponible hors connexion. Connectez-vous une première fois.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
      }
    })());
    return;
  }
  if (url.origin === self.location.origin && staticPaths.has(url.pathname) && !url.search) {
    event.respondWith((async () => await (await caches.open(shellCache)).match(request) ?? fetch(request))());
    return;
  }
  // Media enter this cache only after an explicit, rights-checked download in the app.
  // RSC, authenticated APIs and Quran Foundation responses always go to the network.
  if (request.destination === "audio" || request.destination === "video" || request.headers.has("range")) {
    event.respondWith((async () => {
      const cached = await (await caches.open(offline.mediaCache)).match(url.href);
      return cached ? offline.mediaResponse(cached, request.headers.get("range")) : fetch(request);
    })());
  }
});
