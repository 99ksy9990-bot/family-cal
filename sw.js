const CACHE_NAME = 'pass-cal-v1.2.0';
const PASS_SW_BUILD_VERSION = 'v1.2.0-four-tab-line-icons';
const LUNAR_CDN = 'https://cdn.jsdelivr.net/npm/lunar-javascript/lunar.min.js';
const HTML2CANVAS_CDN = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
const CONFETTI_CDN = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';

const CORE_ASSETS = [
  './',
  './index.html',
  './icon.png',
  './manifest.webmanifest'
];

const OPTIONAL_ASSETS = [
  LUNAR_CDN,
  HTML2CANVAS_CDN,
  CONFETTI_CDN,
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
].filter(Boolean);

async function fetchFresh(url){
  return fetch(url, {cache:'reload'});
}

async function safeCachePut(cache, key, res){
  try{
    if(res && (res.ok || res.type === 'opaque')){
      await cache.put(key, res.clone());
      return true;
    }
  }catch(e){}
  return false;
}

async function cacheFresh(cache, url){
  const res = await fetchFresh(url);
  if(!res || (!res.ok && res.type !== 'opaque')) throw new Error('cache failed: '+url);
  await safeCachePut(cache, url, res);
  return res;
}

async function staleWhileRevalidate(reqOrUrl, cacheKey=reqOrUrl){
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(cacheKey);
  const network = fetch(reqOrUrl, {cache:'reload'}).then(async res=>{
    await safeCachePut(cache, cacheKey, res);
    return res;
  }).catch(()=>cached);
  return cached || network;
}

async function offlineFallback(){
  const cached = await caches.match('./index.html') || await caches.match('./');
  return cached || new Response('<!doctype html><meta charset="utf-8"><title>오프라인</title><body style="font-family:sans-serif;padding:24px">오프라인 상태예요. 연결 후 다시 열어 주세요.</body>', {headers:{'Content-Type':'text/html;charset=utf-8'}, status:503});
}


self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE_NAME);

    // 핵심 파일은 반드시 HTTP 캐시를 우회해서 최신본으로 저장합니다.
    await Promise.all(CORE_ASSETS.map(u => cacheFresh(cache, u)));

    // 선택 파일은 실패해도 설치를 계속합니다.
    await Promise.allSettled(OPTIONAL_ASSETS.map(u => cacheFresh(cache, u).catch(()=>{})));
  })());
});

async function notifyClientsOfUpdate(){
  const clientList = await self.clients.matchAll({type:'window', includeUncontrolled:true});
  clientList.forEach(client=>{
    client.postMessage({type:'PASS_SW_UPDATED', cacheName:CACHE_NAME, build:PASS_SW_BUILD_VERSION});
  });
}

self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
    await notifyClientsOfUpdate();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);

  // 외부 요청은 서비스워커가 간섭하지 않습니다. 단, 앱이 직접 쓰는 CDN은 stale-while-revalidate로 캐시합니다.
  if(url.href === LUNAR_CDN || url.href === HTML2CANVAS_CDN || url.href === CONFETTI_CDN){
    event.respondWith(staleWhileRevalidate(req, url.href));
    return;
  }

  if(url.origin !== self.location.origin) return;

  if(url.pathname.endsWith('/reset-sw.html') || url.pathname.endsWith('/version.txt')){
    event.respondWith(fetch(req, {cache:'reload'}).catch(()=>offlineFallback()));
    return;
  }

  if(req.mode === 'navigate'){
    event.respondWith((async()=>{
      try{
        const res = await fetch(req, {cache:'reload'});
        const cache = await caches.open(CACHE_NAME);
        await safeCachePut(cache, './index.html', res);
        await safeCachePut(cache, './', res);
        return res;
      }catch(e){
        return offlineFallback();
      }
    })());
    return;
  }

  // 정적 파일은 캐시 먼저 응답하고, 백그라운드에서 최신본으로 갱신합니다.
  event.respondWith((async()=>{
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const update = fetch(req).then(async res=>{
      await safeCachePut(cache, req, res);
      return res;
    }).catch(()=>cached);
    return cached || update || offlineFallback();
  })());
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) { data = { title: '아워', body: event.data ? event.data.text() : '새 알림이 있어요.' }; }
  const title = data.title || '아워';
  const options = {
    body: data.body || '가족 일정 알림이 있어요.',
    icon: data.icon || './icon.png',
    badge: data.badge || './icon.png',
    data: data.url || './',
    tag: data.tag || 'our-family-schedule',
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data || './';
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    for (const client of allClients) {
      if ('focus' in client) {
        client.focus();
        if (client.navigate) client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});
