// Service worker: caches the core shell so the card opens even offline
// once it's been visited once. Runs only over http(s) — browsers block
// service workers on file:// pages, which is expected while you're
// previewing the file locally.

const CACHE_NAME = 'dolly-friendship-day-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './images/dolly.jpg',
  './images/gift.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll would fail entirely if one asset (like images not yet
      // uploaded) is missing, so cache what's available individually.
      return Promise.all(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            /* asset not present yet — skip it, don't block install */
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
