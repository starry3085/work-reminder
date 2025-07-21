// Service Worker for Office Wellness Reminder
const CACHE_NAME = 'office-wellness-reminder-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/js/app.js',
  '/js/activity-detector.js',
  '/js/app-settings.js',
  '/js/error-handler.js',
  '/js/mobile-adapter.js',
  '/js/notification-service.js',
  '/js/posture-reminder.js',
  '/js/reminder-manager.js',
  '/js/storage-manager.js',
  '/js/ui-controller.js',
  '/js/water-reminder.js',
  '/assets/default-icon.png',
  '/assets/favicon.ico',
  '/assets/notification.mp3',
  '/assets/posture-icon.png',
  '/assets/posture-reminder.mp3',
  '/assets/water-icon.png',
  '/assets/water-reminder.mp3'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});