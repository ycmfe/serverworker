importScripts('https://g.alicdn.com/kg/workbox/3.3.0/workbox-sw.js');
workbox.setConfig({
    modulePathPrefix: 'https://g.alicdn.com/kg/workbox/3.3.0/'
});
let currentCacheNames = Object.assign(
    { precacheTemp: workbox.core.cacheNames.precache + "-temp" },
    workbox.core.cacheNames
  );
  
currentCacheNames.cdnLong = "qiniuCdnLong";
currentCacheNames.cdn = "qiniucdn";
currentCacheNames.html = "html";
// 对主HTML进行缓存，策略是network优先
workbox.routing.registerRoute(
    new RegExp('/$'),
    workbox.strategies.networkFirst({
      cacheName: currentCacheNames.html,
      plugins: [
        // Force Cache
        new workbox.cacheableResponse.Plugin({
          statuses: [0, 200], // One or more status codes that a Response can have and be considered cacheable.
        }),
      ]
    }),
);
// 长线资源
workbox.routing.registerRoute(
    new RegExp('https://(fp|static)\.yangcong345\.com\/middle'),
    workbox.strategies.cacheFirst({
        cacheName: currentCacheNames.cdnLong,
        plugins: [
            new workbox.expiration.Plugin({
                maxEntries: 10, // 最大的缓存数，超过之后则走 LRU 策略清除最老最少使用缓存
            }),
        ],
    })
);

workbox.routing.registerRoute(
    new RegExp('.*\.(?:js|css)'),
    workbox.strategies.staleWhileRevalidate({
        cacheName: currentCacheNames.cdn,
        plugins: [
            new workbox.expiration.Plugin({
                maxEntries: 60, // 最大的缓存数，超过之后则走 LRU 策略清除最老最少使用缓存
            }),
        ],
    })
);
self.addEventListener("activate", function(event) {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        console.log(cacheNames);
        let validCacheSet = new Set(Object.values(currentCacheNames));
        return Promise.all(
          cacheNames
            .filter(function(cacheName) {
              return !validCacheSet.has(cacheName);
            })
            .map(function(cacheName) {
              console.log("deleting cache", cacheName);
              return caches.delete(cacheName);
            })
        );
      })
    );
});
