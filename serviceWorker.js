if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        const sw = navigator.serviceWorker;
        /**
         * 卸载
         */
        function unRegister(){
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
        }
        // 兜底方案
        fetch('/fallback?project=1').then((relegation) => {
            // 服务端通知强行降级
            if(relegation){
                unRegister();
                return;
            }
            sw.register('sw.js').then(() => {}).catch((e) => {
                console.error('Error during service worker registration:', e)
                unRegister();
            });
        })
        .catch(() => {
            unRegister()
        })
    });
}
