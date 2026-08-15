// Service Worker — SER Hub v5
// Estratégia: cache-first para assets estáticos, network-first para dados

const CACHE_NAME = 'ser-hub-v20';
const STATIC_ASSETS = ['/', '/index.html', '/logo.png', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return; // ignora POST/PATCH/DELETE

  const url = new URL(request.url);

  // Supabase e CDNs: network-first (dados sempre frescos; fallback cache)
  if (url.hostname.includes('supabase') || url.hostname.includes('cdn.jsdelivr') || url.hostname.includes('jsdelivr')) {
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Assets estáticos (same-origin): cache-first
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
        return res;
      }).catch(() => {
        // Offline fallback: retorna index.html para navegação
        if (request.destination === 'document') return caches.match('/index.html');
      });
    })
  );
});
