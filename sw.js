/* Cahier de formules — fonctionne sans réseau (amphi) */
const VERSION = 'cahier-4889a43f05';
const CORE = ['./', './index.html', './firebase.js', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('cahier-') && k !== VERSION && k !== 'cahier-fonts').map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // l'appli elle-même : réponse immédiate depuis le cache, mise à jour en arrière-plan
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.open(VERSION).then((cache) =>
        cache.match(req, { ignoreSearch: true }).then((hit) => {
          const net = fetch(req).then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => hit || cache.match('./index.html'));
          return hit || net;
        })
      )
    );
    return;
  }

  // polices Google : gardées après la première ouverture
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open('cahier-fonts').then((cache) =>
        cache.match(req).then((hit) => hit || fetch(req).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        }).catch(() => hit))
      )
    );
  }
});
