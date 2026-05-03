const CACHE_NAME = 'pass-cal-v1.0.2';
const urlsToCache = [
  './',
  './index.html',
  './icon.png',
  './manifest.webmanifest'
];

// 1. 설치(Install) 단계: 초기 파일들을 캐시에 저장합니다.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 2. 패치(Fetch) 단계: 오프라인 지원을 위한 Network-First 전략입니다.
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 인터넷이 연결되어 네트워크 요청이 성공하면, 최신본으로 캐시를 업데이트합니다.
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        // 인터넷이 끊겼거나 네트워크가 실패하면, 폰에 저장된 캐시(오프라인 데이터)를 꺼내 보여줍니다.
        return caches.match(event.request);
      })
  );
});

// 3. 활성화(Activate) 단계: 앱이 업데이트되면 쓰레기(구버전 캐시)를 청소합니다.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
