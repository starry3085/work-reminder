// Hydrate Move Service Worker
// 简单的缓存策略，支持离线使用

const CACHE_NAME = 'hydrate-move-v1.0.1';
const urlsToCache = [
  './',
  './index.html',
  './styles/main.css',
  './js/constants.js',
  './js/app.js',
  './js/ui-controller.js',
  './js/reminder-manager.js',
  './js/water-reminder.js',
  './js/standup-reminder.js',
  './js/notification-service.js',
  './js/storage-manager.js',
  './js/app-settings.js',
  './js/error-handler.js',
  './js/mobile-adapter.js',
  './js/demo-controller.js',
  './manifest.json'
];

// 安装事件 - 缓存资源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 获取事件 - 提供缓存内容
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // 如果缓存中有，返回缓存版本
        if (response) {
          return response;
        }
        // 否则从网络获取
        return fetch(event.request);
      }
    )
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});