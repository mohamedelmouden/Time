const CACHE = 'flame-v5';
const APP_ROOT = new URL('./', self.registration.scope).href;

/**
 * Only cache the HTML shell and manifest/icons for offline support.
 * JS/CSS chunks have content-hash filenames and are cached automatically
 * by the browser's HTTP cache (Vercel sets long Cache-Control for them).
 * Caching them in the SW caused stale-asset conflicts after redeployments.
 */
const isHashedAsset = (url) => /\.[0-9a-f]{8,}\.(js|css)$/i.test(url) || /\/assets\//.test(url);

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.add(APP_ROOT);
    await Promise.all(
      [new URL('manifest.webmanifest', APP_ROOT).href, new URL('icon.svg', APP_ROOT).href]
        .map((url) => cache.add(url).catch(() => {}))
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;

  // Navigation requests: network-first, fall back to cached shell.
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then(async (res) => {
        if (res.ok) {
          const cp = res.clone();
          caches.open(CACHE).then((c) => c.put(APP_ROOT, cp));
          return res;
        }
        return (await caches.match(APP_ROOT)) || res;
      }).catch(async () => (await caches.match(APP_ROOT)) || Response.error())
    );
    return;
  }

  // Hashed assets (JS/CSS chunks): always go to network; never SW-cache.
  // The browser HTTP cache will handle them. This avoids stale-chunk conflicts.
  if (isHashedAsset(r.url)) return;

  // Other static assets (icons, manifest, fonts): network-first with SW cache fallback.
  e.respondWith(
    fetch(r).then(async (res) => {
      if (res.ok) {
        const cp = res.clone();
        caches.open(CACHE).then((c) => c.put(r, cp));
        return res;
      }
      return (await caches.match(r)) || res;
    }).catch(() => caches.match(r).then((m) => m || Response.error()))
  );
});
