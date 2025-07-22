// Service Worker for Office Wellness Reminder
const CACHE_VERSION = '2';
const CACHE_NAME = 'office-wellness-reminder-v' + CACHE_VERSION;

// 资源分类
const STATIC_CACHE = 'static-cache-v' + CACHE_VERSION;
const DYNAMIC_CACHE = 'dynamic-cache-v' + CACHE_VERSION;
const ASSETS_CACHE = 'assets-cache-v' + CACHE_VERSION;

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// 需要缓存的JS文件
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

// 需要缓存的媒体资源
const MEDIA_ASSETS = [
  '/assets/default-icon.png',
  '/assets/favicon.ico',
  '/assets/notification.mp3',
  '/assets/posture-icon.png',
  '/assets/posture-reminder.mp3',
  '/assets/water-icon.png',
  '/assets/water-reminder.mp3'
];

// 安装事件 - 缓存核心资源
self.addEventListener('install', event => {
  console.log('[Service Worker] 安装中...');
  
  // 跳过等待，立即激活
  self.skipWaiting();
  
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[Service Worker] 缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // 缓存JS资源
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[Service Worker] 缓存JS资源');
        return cache.addAll(JS_ASSETS);
      }),
      
      // 缓存媒体资源
      caches.open(ASSETS_CACHE).then(cache => {
        console.log('[Service Worker] 缓存媒体资源');
        return cache.addAll(MEDIA_ASSETS);
      })
    ])
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[Service Worker] 激活中...');
  
  // 立即接管所有客户端
  event.waitUntil(clients.claim());
  
  // 清理旧版本缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 删除不在当前版本的缓存
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== ASSETS_CACHE
          ) {
            console.log('[Service Worker] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 获取请求的缓存策略
function getCacheStrategy(url) {
  const requestURL = new URL(url);
  
  // 静态资源使用缓存优先策略
  if (STATIC_ASSETS.includes(requestURL.pathname)) {
    return {
      cacheName: STATIC_CACHE,
      strategy: 'cache-first'
    };
  }
  
  // JS文件使用缓存优先策略
  if (JS_ASSETS.includes(requestURL.pathname) || requestURL.pathname.endsWith('.js')) {
    return {
      cacheName: STATIC_CACHE,
      strategy: 'cache-first'
    };
  }
  
  // 媒体文件使用缓存优先策略
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
  
  // 其他资源使用网络优先策略
  return {
    cacheName: DYNAMIC_CACHE,
    strategy: 'network-first'
  };
}

// 缓存优先策略
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // 如果缓存中没有，则从网络获取
    const networkResponse = await fetch(request);
    
    // 检查响应是否有效
    if (networkResponse && networkResponse.status === 200) {
      // 将响应克隆一份存入缓存
      // 因为响应流只能使用一次
      const clonedResponse = networkResponse.clone();
      cache.put(request, clonedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] 缓存优先策略失败:', error);
    // 如果网络请求失败，返回一个离线页面或错误响应
    return new Response('网络请求失败，无法获取资源', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// 网络优先策略
async function networkFirst(request, cacheName) {
  try {
    // 先尝试从网络获取
    const networkResponse = await fetch(request);
    
    // 检查响应是否有效
    if (networkResponse && networkResponse.status === 200) {
      // 将响应克隆一份存入缓存
      const cache = await caches.open(cacheName);
      const clonedResponse = networkResponse.clone();
      cache.put(request, clonedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] 网络请求失败，尝试从缓存获取');
    
    // 如果网络请求失败，尝试从缓存获取
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 如果缓存中也没有，返回一个离线页面或错误响应
    return new Response('您当前处于离线状态，无法获取资源', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// 拦截请求事件
self.addEventListener('fetch', event => {
  const strategy = getCacheStrategy(event.request.url);
  
  if (strategy.strategy === 'cache-first') {
    event.respondWith(cacheFirst(event.request, strategy.cacheName));
  } else {
    event.respondWith(networkFirst(event.request, strategy.cacheName));
  }
});

// 后台同步事件 - 用于离线操作后的数据同步
self.addEventListener('sync', event => {
  console.log('[Service Worker] 后台同步事件:', event.tag);
  
  if (event.tag === 'sync-settings') {
    // 这里可以实现设置同步逻辑
    console.log('[Service Worker] 同步用户设置');
  }
});

// 推送通知事件
self.addEventListener('push', event => {
  console.log('[Service Worker] 收到推送消息:', event.data.text());
  
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
        title: data.type === 'water' ? '已喝水' : '已起身活动'
      },
      {
        action: 'snooze',
        title: '稍后提醒'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'confirm') {
    // 处理确认操作
    console.log('[Service Worker] 用户确认了提醒:', event.notification.data.type);
  } else if (event.action === 'snooze') {
    // 处理稍后提醒操作
    console.log('[Service Worker] 用户选择稍后提醒:', event.notification.data.type);
  } else {
    // 默认操作 - 打开应用
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // 如果已经有打开的窗口，则聚焦到该窗口
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // 如果没有打开的窗口，则打开一个新窗口
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});