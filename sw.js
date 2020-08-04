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
currentCacheNames.font = "font";

// 预缓存策略
workbox.precaching.precacheAndRoute(
  self.__precacheManifest || [], {
    ignoreUrlParametersMatching: [/\./],
    cleanUrls: false,
  }
);

const cachedResponseWillBeUsed = ({ cache, request, cachedResponse }) => {
  if (cachedResponse) {
    return cachedResponse
  }
  return caches.match(request.url, { ignoreSearch: true })
}

const catchAll = ({ url, event }) => {
  return !/OnionMath.*.(?:ttf)/.test(url.href)
}

// 对主HTML进行缓存，策略是network优先
workbox.routing.registerRoute(
    catchAll,
    workbox.strategies.networkFirst({
      cacheName: currentCacheNames.html,
      plugins: [
        { cachedResponseWillBeUsed },
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
// 业务线脚本
workbox.routing.registerRoute(
    new RegExp('.*\.(?:js|css|png|jpe?g)'),
    workbox.strategies.staleWhileRevalidate({
        cacheName: currentCacheNames.cdn,
        plugins: [
            new workbox.expiration.Plugin({
                maxEntries: 60, // 最大的缓存数，超过之后则走 LRU 策略清除最老最少使用缓存
            }),
        ],
    })
);

const matchTTF = ({ url, event }) => {
  return (
    new RegExp('.*.(?:ttf)').test(url.href) &&
    !/OnionMath.*.(?:ttf)/.test(url.href)
  )
}

// 字体
workbox.routing.registerRoute(
  matchTTF,
  workbox.strategies.cacheFirst({
      cacheName: currentCacheNames.font,
      plugins: [
          new workbox.expiration.Plugin({
              maxEntries: 20, // 最大的缓存数，超过之后则走 LRU 策略清除最老最少使用缓存
          }),
      ],
  })
);

// 添加缓存
self.addEventListener("install", event => {
  console.log('install')
  // 跳过 waiting 状态，然后会直接进入 activate 阶段
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function(event) {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        let validCacheSet = new Set(Object.values(currentCacheNames));
        return Promise.all(
          [
            // 更新所有客户端 Service Worker
            self.clients.claim(),
            cacheNames
              .filter(function(cacheName) {
                return !validCacheSet.has(cacheName);
              })
              .map(function(cacheName) {
                console.log("deleting cache", cacheName);
                return caches.delete(cacheName);
              })
          ]
        );
      })
    );
});
// 可以在各业务线自己实现sw文件的更新策略
self.addEventListener('message', event => {
  const replyPort = event.ports[0]
  const message = event.data
  if (replyPort && message && message.type === 'skip-waiting') {
    event.waitUntil(
      self.skipWaiting()
        .then(() => replyPort.postMessage({ error: null }))
        .catch(error => replyPort.postMessage({ error }))
    )
  }
})
