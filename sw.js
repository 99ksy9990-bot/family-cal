const CACHE_NAME = 'pass-cal-v1.0.2';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.png',
  './icon-dark.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './og.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. 앱 화면(index.html)은 네트워크 우선
  // 새 코드가 올라오면 최대한 최신 버전이 뜨게 함
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put('./index.html', copy);
          });
          return res;
        })
        .catch(() => {
          return caches.match('./index.html')
            .then(cached => cached || caches.match('./'));
        })
    );
    return;
  }

  // 2. 같은 사이트의 정적 파일은 캐시 우선
  // icon, manifest, og 이미지 등
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req)
        .then(cached => {
          return cached || fetch(req).then(res => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(req, copy);
              });
            }
            return res;
          });
        })
    );
    return;
  }

  // 3. 외부 CDN/Firebase는 네트워크 우선
  // Firebase 데이터 통신을 캐시하면 꼬일 수 있음
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
