const CACHE = 'travel-plan-v2';
const ASSETS = ['.', 'index.html', 'style.css', 'app.js', 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('openweathermap.org') || e.request.url.includes('cdn.jsdelivr')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
  } else {
    e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
  }
});
