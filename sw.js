// Service Worker — SER Hub v6
// Estratégia: network-first para index.html/navegação (sempre pega versão nova),
// cache-first só para assets realmente estáticos (logo, manifest), network-first para dados

const CACHE_NAME = 'ser-hub-v35';
const STATIC_ASSETS = ['/logo.png', '/manifest.json'];

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

  // Navegação / index.html: network-first — sempre tenta pegar a versão mais nova do app;
  // só usa o cache se estiver offline. Evita ficar preso numa versão antiga depois de um deploy.
  const isNavigation = request.mode === 'navigate' || request.destination === 'document'
    || url.pathname === '/' || url.pathname.endsWith('/index.html');
  if (isNavigation) {
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('/index.html')))
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
