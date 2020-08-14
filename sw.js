const CACHE_NAME = 'v1';
const longCacheFirst = new RegExp('https://(fp|static)\.yangcong345\.com\/middle');
const staleWhileRevalidate = new RegExp('.*.(?:js|css|png|jpe?g|gif)', 'i');

const netWorkFirst = ({ url, event }) => {
  // 网络优先的策略
  return !/OnionMath.*.(?:ttf)/.test(url)
}
const cacheOnly = ({ url, event }) => {
  return new RegExp('https://(fp|static)\.yangcong345\.com\/middle').test(url)
}

const util = {
  fetchPut: function (request) {
    return fetch(request).then(function (response) {
      if (response.status !== 200) {
        return response;
      }
      util.putCache(request, response.clone());
      return response;
    });
  },
  putCache: function (request, resource) {
    const realUrl = request.url.split('?')[0];
    console.log('putCache', realUrl)
    if (request.method === "GET") {
      console.log('sw缓存', realUrl);
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(request, resource);
      });
    }
  }
};

self.addEventListener('fetch', function (event) {
  const url = event.request.url;
  // http和本地的资源略过
  if (/^http\:\/\//.test(url) && /(127\.0\.0\.1|localhost)/.test(url) === false) {
    return
  }
  console.log('fetch', url);
  event.respondWith(
    caches.match(event.request).then(function (response) {
      if (!netWorkFirst({ url: url, event }) && response && response.status === 200) {
        //长缓存
        !cacheOnly({url: url, event}) && util.fetchPut(event.request.clone())
        return response;
      }
      return util.fetchPut(event.request.clone());
    })
  );
});


self.addEventListener('install', function (event) {
  console.log('install')
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  console.log('activate')
  Promise.all([
    //更新客户端
    caches.keys().then(cacheList => {
      return Promise.all(
        cacheList.map(cacheName => {
          console.log('已缓存的CACHE_NAME：', cacheName);
          if (cacheName !== CACHE_NAME) {
            console.log('删除掉缓存CACHE_NAME：', cacheName);
            caches.delete(cacheName);
          }
        })
      )
    })
  ])
});
