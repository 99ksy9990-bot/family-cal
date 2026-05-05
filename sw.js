const CACHE_NAME = 'pass-cal-v1.0.69';
const PASS_SW_BUILD_VERSION = 'v1.0.69-calendar-detail-actions';
const LUNAR_CDN = 'https://cdn.jsdelivr.net/npm/lunar-javascript/lunar.min.js';
const HTML2CANVAS_CDN = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

const CORE_ASSETS = [
  './',
  './index.html',
  './icon.png',
  './manifest.webmanifest'
];

const OPTIONAL_ASSETS = [
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
].filter(Boolean);

async function fetchFresh(url){
  const sep = String(url).includes('?') ? '&' : '?';
  const freshUrl = `${url}${sep}swv=${encodeURIComponent(CACHE_NAME)}&t=${Date.now()}`;
  return fetch(freshUrl, {cache:'reload'});
}

async function cacheFresh(cache, url){
  const res = await fetchFresh(url);
  if(!res || (!res.ok && res.type !== 'opaque')) throw new Error('cache failed: '+url);
  await cache.put(url, res.clone());
  return res;
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

  // 외부 요청은 서비스워커가 간섭하지 않습니다. 단, 사용하는 CDN 2개만 캐시 폴백을 둡니다.
  if(url.href === LUNAR_CDN || url.href === HTML2CANVAS_CDN){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(req, copy));
        return res;
      }).catch(()=>caches.match(req))
    );
    return;
  }

  if(url.origin !== self.location.origin) return;

  // reset 파일은 항상 네트워크 우선으로 통과시킵니다.
  if(url.pathname.endsWith('/reset-sw.html') || url.pathname.endsWith('/version.txt')){
    event.respondWith(fetch(req, {cache:'reload'}));
    return;
  }

  // 페이지 진입은 항상 네트워크 최신본 우선.
  if(req.mode === 'navigate'){
    event.respondWith((async()=>{
      try{
        const res = await fetch(req, {cache:'reload'});
        const copy = res.clone();
        const cache = await caches.open(CACHE_NAME);
        await cache.put('./index.html', copy.clone());
        await cache.put('./', copy.clone());
        return res;
      }catch(e){
        const cached = await caches.match('./index.html') || await caches.match('./');
        return cached || new Response('offline', {status:503, statusText:'offline'});
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached = await caches.match(req);
    if(cached) return cached;
    try{
      const res = await fetch(req);
      if(res && res.status === 200){
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(req, copy));
      }
      return res;
    }catch(e){
      const cachedIndex = await caches.match('./index.html');
      return cachedIndex || new Response('offline', {status:503, statusText:'offline'});
    }
  })());
});
