const CACHE_NAME = 'pass-cal-v1.0.53';
const LUNAR_CDN = 'https://cdn.jsdelivr.net/npm/lunar-javascript/lunar.min.js';
const HTML2CANVAS_CDN = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
const CORE_ASSETS = [
  './',
  './index.html',
  './icon.png',
  './manifest.webmanifest'
];
const APP_SHELL = [
  ...CORE_ASSETS,
  LUNAR_CDN,
  HTML2CANVAS_CDN,
  './assets/fonts/Freesentation-4Regular.ttf',
  './assets/fonts/Freesentation-6SemiBold.ttf',
  './assets/avatars/adultF_1.webp',
  './assets/avatars/adultF_2.webp',
  './assets/avatars/adultF_3.webp',
  './assets/avatars/adultF_4.webp',
  './assets/avatars/adultF_5.webp',
  './assets/avatars/adultM_1.webp',
  './assets/avatars/adultM_2.webp',
  './assets/avatars/adultM_3.webp',
  './assets/avatars/adultM_4.webp',
  './assets/avatars/adultM_5.webp',
  './assets/avatars/childF_1.webp',
  './assets/avatars/childF_2.webp',
  './assets/avatars/childF_3.webp',
  './assets/avatars/childF_4.webp',
  './assets/avatars/childF_5.webp',
  './assets/avatars/childM_1.webp',
  './assets/avatars/childM_2.webp',
  './assets/avatars/childM_3.webp',
  './assets/avatars/childM_4.webp',
  './assets/avatars/childM_5.webp',
  './assets/avatars/family_1.webp',
  './assets/avatars/family_2.webp',
  './assets/avatars/family_3.webp',
  './assets/avatars/family_4.webp',
  './assets/avatars/family_5.webp',
  './assets/avatars/teenF_1.webp',
  './assets/avatars/teenF_2.webp',
  './assets/avatars/teenF_3.webp',
  './assets/avatars/teenF_4.webp',
  './assets/avatars/teenF_5.webp',
  './assets/avatars/teenM_1.webp',
  './assets/avatars/teenM_2.webp',
  './assets/avatars/teenM_3.webp',
  './assets/avatars/teenM_4.webp',
  './assets/avatars/teenM_5.webp'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // 핵심 파일은 반드시 캐시합니다.
      await cache.addAll(CORE_ASSETS);

      // 아바타와 외부 음력 라이브러리는 실패해도 앱 설치를 계속합니다.
      const optionalAssets = APP_SHELL.filter(u => u.includes('/avatars/') || u.includes('/fonts/') || u === LUNAR_CDN || u === HTML2CANVAS_CDN);
      await Promise.allSettled(optionalAssets.map(u => cache.add(u).catch(() => {})));
    })
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 음력 라이브러리만 캐시 폴백을 허용합니다.
  if (url.href === LUNAR_CDN || url.href === HTML2CANVAS_CDN) {
    event.respondWith(
      fetch(req)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Firebase/CDN 등 외부 요청은 서비스워커가 간섭하지 않습니다.
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html').then(cached => cached || caches.match('./') || new Response('offline', {status: 503, statusText: 'offline'})))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(response => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return response;
      }).catch(() => caches.match('./index.html').then(cachedIndex => cachedIndex || new Response('offline', {status: 503, statusText: 'offline'})));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
