const CACHE_NAME = 'pass-cal-v1.0.39-avatar-routine-widget';

const APP_SHELL = [
  './',
  './index.html',
  './icon.png',
  './manifest.webmanifest',
  './assets/avatars/family_1.png',
  './assets/avatars/family_2.png',
  './assets/avatars/family_3.png',
  './assets/avatars/family_4.png',
  './assets/avatars/family_5.png',
  './assets/avatars/family_6.png',
  './assets/avatars/family_7.png',
  './assets/avatars/adultM_1.png',
  './assets/avatars/adultM_2.png',
  './assets/avatars/adultM_3.png',
  './assets/avatars/adultM_4.png',
  './assets/avatars/adultM_5.png',
  './assets/avatars/adultM_6.png',
  './assets/avatars/adultM_7.png',
  './assets/avatars/adultF_1.png',
  './assets/avatars/adultF_2.png',
  './assets/avatars/adultF_3.png',
  './assets/avatars/adultF_4.png',
  './assets/avatars/adultF_5.png',
  './assets/avatars/adultF_6.png',
  './assets/avatars/adultF_7.png',
  './assets/avatars/teenM_1.png',
  './assets/avatars/teenM_2.png',
  './assets/avatars/teenM_3.png',
  './assets/avatars/teenM_4.png',
  './assets/avatars/teenM_5.png',
  './assets/avatars/teenM_6.png',
  './assets/avatars/teenM_7.png',
  './assets/avatars/teenF_1.png',
  './assets/avatars/teenF_2.png',
  './assets/avatars/teenF_3.png',
  './assets/avatars/teenF_4.png',
  './assets/avatars/teenF_5.png',
  './assets/avatars/teenF_6.png',
  './assets/avatars/teenF_7.png',
  './assets/avatars/childM_1.png',
  './assets/avatars/childM_2.png',
  './assets/avatars/childM_3.png',
  './assets/avatars/childM_4.png',
  './assets/avatars/childM_5.png',
  './assets/avatars/childM_6.png',
  './assets/avatars/childM_7.png',
  './assets/avatars/childF_1.png',
  './assets/avatars/childF_2.png',
  './assets/avatars/childF_3.png',
  './assets/avatars/childF_4.png',
  './assets/avatars/childF_5.png',
  './assets/avatars/childF_6.png',
  './assets/avatars/childF_7.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.origin !== self.location.origin) {
    return;
  }

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
      }).catch(() => new Response('offline', {status: 503, statusText: 'offline'}));
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
