// Ignition Fitness Service Worker
// Network-first for pages, cache for offline fallback only

// VERSION: Update this on each deployment to bust cache
const SW_VERSION = '2024-08-16-v2';
const CACHE_NAME = `ignition-${SW_VERSION}`;

// Minimal static assets for offline fallback
const OFFLINE_FALLBACK = ['/'];

// Install: cache minimal offline assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_FALLBACK))
  );
  // Force immediate activation
  self.skipWaiting();
});

// Activate: clean up ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('ignition-') && key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch: network-first for everything, cache only for offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API routes and Next.js internals - never cache these
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('_next/') ||
    url.pathname.startsWith('/reset') ||
    url.pathname.startsWith('/forgot') ||
    url.pathname.startsWith('/admin')
  ) {
    return;
  }

  // For navigation requests (HTML pages): ALWAYS network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses as fallback
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline only: try cache, then fallback to home
          return caches.match(request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // For other assets (images, fonts): network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Listen for messages to force cache clear
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
});
