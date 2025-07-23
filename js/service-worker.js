// Service Worker for Office Wellness Reminder
const CACHE_VERSION = '2';
const CACHE_NAME = 'office-wellness-reminder-v' + CACHE_VERSION;

// Resource categories
const STATIC_CACHE = 'static-cache-v' + CACHE_VERSION;
const DYNAMIC_CACHE = 'dynamic-cache-v' + CACHE_VERSION;
const ASSETS_CACHE = 'assets-cache-v' + CACHE_VERSION;

// Static resources to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// JS files to cache
const JS_ASSETS = [
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
  '/js/water-reminder.js'
];

// Media assets to cache
const MEDIA_ASSETS = [
  '/assets/default-icon.png',
  '/assets/favicon.ico',
  '/assets/notification.mp3',
  '/assets/posture-icon.png',
  '/assets/posture-reminder.mp3',
  '/assets/water-icon.png',
  '/assets/water-reminder.mp3'
];

// Install event - cache core resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  // Skip waiting, activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[Service Worker] Caching static resources');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache JS resources
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[Service Worker] Caching JS resources');
        return cache.addAll(JS_ASSETS);
      }),
      
      // Cache media resources
      caches.open(ASSETS_CACHE).then(cache => {
        console.log('[Service Worker] Caching media resources');
        return cache.addAll(MEDIA_ASSETS);
      })
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  // Immediately take control of all clients
  event.waitUntil(clients.claim());
  
  // Clean up old version caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete caches not in current version
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== ASSETS_CACHE
          ) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Get cache strategy for request
function getCacheStrategy(url) {
  const requestURL = new URL(url);
  
  // Static resources use cache-first strategy
  if (STATIC_ASSETS.includes(requestURL.pathname)) {
    return {
      cacheName: STATIC_CACHE,
      strategy: 'cache-first'
    };
  }
  
  // JS files use cache-first strategy
  if (JS_ASSETS.includes(requestURL.pathname) || requestURL.pathname.endsWith('.js')) {
    return {
      cacheName: STATIC_CACHE,
      strategy: 'cache-first'
    };
  }
  
  // Media files use cache-first strategy
  if (
    MEDIA_ASSETS.includes(requestURL.pathname) ||
    requestURL.pathname.endsWith('.png') ||
    requestURL.pathname.endsWith('.jpg') ||
    requestURL.pathname.endsWith('.svg') ||
    requestURL.pathname.endsWith('.mp3') ||
    requestURL.pathname.endsWith('.ico')
  ) {
    return {
      cacheName: ASSETS_CACHE,
      strategy: 'cache-first'
    };
  }
  
  // Other resources use network-first strategy
  return {
    cacheName: DYNAMIC_CACHE,
    strategy: 'network-first'
  };
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Check if response is valid
    if (networkResponse && networkResponse.status === 200) {
      // Clone response and store in cache
      // Because response stream can only be used once
      const clonedResponse = networkResponse.clone();
      cache.put(request, clonedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache-first strategy failed:', error);
    // If network request fails, return offline page or error response
    return new Response('Network request failed, unable to get resource', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    // Try to fetch from network first
    const networkResponse = await fetch(request);
    
    // Check if response is valid
    if (networkResponse && networkResponse.status === 200) {
      // Clone response and store in cache
      const cache = await caches.open(cacheName);
      const clonedResponse = networkResponse.clone();
      cache.put(request, clonedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network request failed, trying cache');
    
    // If network request fails, try to get from cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache either, return offline page or error response
    return new Response('You are currently offline, unable to get resource', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Intercept fetch events
self.addEventListener('fetch', event => {
  const strategy = getCacheStrategy(event.request.url);
  
  if (strategy.strategy === 'cache-first') {
    event.respondWith(cacheFirst(event.request, strategy.cacheName));
  } else {
    event.respondWith(networkFirst(event.request, strategy.cacheName));
  }
});

// Background sync event - for data sync after offline operations
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync event:', event.tag);
  
  if (event.tag === 'sync-settings') {
    // Settings sync logic can be implemented here
    console.log('[Service Worker] Syncing user settings');
  }
});

// Push notification event
self.addEventListener('push', event => {
  console.log('[Service Worker] Received push message:', event.data.text());
  
  const data = JSON.parse(event.data.text());
  
  const options = {
    body: data.message,
    icon: data.type === 'water' ? '/assets/water-icon.png' : '/assets/posture-icon.png',
    badge: '/assets/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      type: data.type,
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'confirm',
        title: data.type === 'water' ? 'Drank Water' : 'Moved'
      },
      {
        action: 'snooze',
        title: 'Remind Later'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'confirm') {
    // Handle confirm action
    console.log('[Service Worker] User confirmed reminder:', event.notification.data.type);
  } else if (event.action === 'snooze') {
    // Handle snooze action
    console.log('[Service Worker] User chose to snooze:', event.notification.data.type);
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // If there's already an open window, focus on it
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // If no open window, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});