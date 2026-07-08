const CACHE = 'focus-clock-v3';
const ASSETS = [
  '/',
  '/sw.js',
  '/index.html',
  '/css/styles.css',
  '/manifest.json',
  '/icon.svg',
  '/js/app.js',
  '/js/constants.js',
  '/js/dom.js',
  '/js/format-date.js',
  '/js/format-time.js',
  '/js/timer-clock.js',
  '/js/page-lifecycle.js',
  '/js/event-bus.js',
  '/js/sound-settings.js',
  '/js/cities.js',
  '/js/storage.js',
  '/js/router.js',
  '/js/shared.js',
  '/js/url-state.js',
  '/js/city-search-modal.js',
  '/js/routines.js',
  '/js/tasks.js',
  '/js/timer.js',
  '/js/countdown-timer.js',
  '/js/stopwatch-engine.js',
  '/js/sounds.js',
  '/js/timezone-data.js',
  '/js/timezone-utils.js',
  '/js/pages/pomodoro-helpers.js',
  '/js/pages/pomodoro.js',
  '/js/pages/timezones.js',
  '/js/pages/daily-planner.js',
  '/js/pages/world-clock.js',
  '/js/pages/timer-page.js',
  '/js/pages/stopwatch-page.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).then((res) => {
        if (res.ok && e.request.url.startsWith(self.location.origin)) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached)
    )
  );
});