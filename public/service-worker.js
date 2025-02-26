// public/service-worker.js

const CACHE_NAME = 'fertilizer-app-v1';

// Assets to cache during installation
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/farmers',
  '/visits',
  '/purchases',
  '/offline',
  '/favicon.ico',
  '/login',
  // Add CSS and JS files based on your app structure
  // Include any critical resources required for offline functionality
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell and static assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip Firebase API requests (let the app handle them)
  if (
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('/api/')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return the response
      if (response) {
        return response;
      }

      // Clone the request (it's a one-time use object)
      const fetchRequest = event.request.clone();

      // Try fetching from the network
      return fetch(fetchRequest)
        .then((response) => {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== 'basic'
          ) {
            return response;
          }

          // Clone the response (it's a one-time use object)
          const responseToCache = response.clone();

          // Open the cache and add the fetched resource
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Network failed, try to return the offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline');
          }

          // Return null for other resources
          return null;
        });
    })
  );
});
