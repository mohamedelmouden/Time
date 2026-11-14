const CACHE = 'flame-v3';
const APP_ROOT = new URL('./', self.registration.scope).href;
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll([APP_ROOT, new URL('manifest.webmanifest', APP_ROOT).href, new URL('icon.svg', APP_ROOT).href]).catch(() => {}))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('flame-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(async (res) => {
      if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(APP_ROOT, cp)); return res; }
      return (await caches.match(r)) || (await caches.match(APP_ROOT)) || res;
    }).catch(async () => (await caches.match(r)) || (await caches.match(APP_ROOT)) || Response.error()));
    return;
  }
  e.respondWith(
    fetch(r).then(async (res) => {
      if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); return res; }
      return (await caches.match(r)) || res;
    })
      .catch(() => caches.match(r).then((m) => m || caches.match(APP_ROOT)))
  );
});
