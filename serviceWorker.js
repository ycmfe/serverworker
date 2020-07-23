if ('serviceWorker' in navigator) {
    const sw = navigator.serviceWorker;
    // 兜底方案
    fetch('/fallback').then((relegation) => {
        // 为了保证首屏渲染性能，可以在页面 load 完之后注册 Service Worker
        window.addEventListener('load', function() {
            // 服务端通知强行降级
            if(relegation){
                sw.getRegistration('sw').then(registration => {
                    // 手动注销
                    registration.unregister();
                    // 清除缓存
                    window.caches && caches.keys && caches.keys().then((keys) => {
                        keys.forEach(function(key) {
                            caches.delete(key);
                        });
                    });
                });
                return;
            }
            sw.register('sw.js');
        });
    })
}
