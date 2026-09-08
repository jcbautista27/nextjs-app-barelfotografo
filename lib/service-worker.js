// Service Worker de modo consulta offline.
// Solo cachea las respuestas GET de consulta (mesas, cuentas abiertas, catálogo)
// con estrategia "red primero, caché como respaldo" para mostrar el último
// estado conocido cuando no hay conexión. Nunca interviene métodos de escritura
// (POST/PATCH/DELETE) ni rutas fuera de /api.
const CACHE_NAME = "ef-consulta-v1";

// Endpoints de solo lectura que pueden servirse desde caché sin conexión:
//   /api/tables, /api/tables/[id]
//   /api/orders/current, /api/orders/[id]
//   /api/products (catálogo para consultar precios)
const READ_ONLY = /^\/api\/(?:tables(?:\/[0-9a-f-]{36})?|orders\/current|orders\/[0-9a-f-]{36}|products)$/;

/** Actualiza el SW sin esperar a que cierren todas las pestañas. */
function skipWaitingAndClaim() {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
        await self.clients.claim();
      })()
    );
  });
}

/** Red primero; si falla la red o el origen no responde, sirve la última copia. */
function readFirstFallbackCache(request) {
  return (async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const fresh = await fetch(request);
      if (fresh.ok) {
        cache.put(request, fresh.clone());
        return fresh;
      }
      throw new Error("network-not-ok");
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      return Response.error();
    }
  })();
}

skipWaitingAndClaim();

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;
  if (!READ_ONLY.test(url.pathname)) return;

  event.respondWith(readFirstFallbackCache(event.request));
});