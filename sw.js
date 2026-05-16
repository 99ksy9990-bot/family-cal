const CACHE_NAME = 'pass-cal-v1.3.87-work-tab-rhythm';
const PASS_SW_BUILD_VERSION = 'v1.3.83-home-date-context';
const LUNAR_CDN = 'https://cdn.jsdelivr.net/npm/lunar-javascript/lunar.min.js';
const HTML2CANVAS_CDN = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
const CONFETTI_CDN = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';

const CORE_ASSETS = [
  './',
  './index.html',
  './icon.png',
  './manifest.webmanifest'
,
  './styles.css',
  './app.js'];

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
  './assets/avatars/seniorM_1.webp',
  './assets/avatars/seniorM_2.webp',
  './assets/avatars/seniorM_3.webp',
  './assets/avatars/seniorM_4.webp',
  './assets/avatars/seniorM_5.webp',
  './assets/avatars/seniorM_6.webp',
  './assets/avatars/seniorF_1.webp',
  './assets/avatars/seniorF_2.webp',
  './assets/avatars/seniorF_3.webp',
  './assets/avatars/seniorF_4.webp',
  './assets/avatars/seniorF_5.webp',
  './assets/avatars/seniorF_6.webp',
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

async function cacheFresh(cache, url, retry=1){
  let lastErr;
  for(let i=0;i<=retry;i++){
    try{
      const res = await fetchFresh(url);
      if(!res || (!res.ok && res.type !== 'opaque')) throw new Error('cache failed: '+url);
      await safeCachePut(cache, url, res);
      return res;
    }catch(e){lastErr=e; if(i<retry)await new Promise(r=>setTimeout(r,500));}
  }
  throw lastErr;
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
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isAllowedCdn = url.href === LUNAR_CDN || url.href === HTML2CANVAS_CDN || url.href === CONFETTI_CDN;

  // Firebase, Google API 등 외부 데이터 요청은 서비스워커가 캐시하지 않습니다.
  if (url.origin !== self.location.origin && !isAllowedCdn) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      // Network-First: 최신 파일을 먼저 가져옵니다.
      const response = await fetch(req, {cache: 'reload'});
      if (response && (response.ok || response.type === 'opaque')) {
        try {
          await cache.put(req, response.clone());
          if (req.mode === 'navigate') {
            await cache.put('./index.html', response.clone());
          }
        } catch (e) {
          // opaque/CORS/스토리지 실패가 있어도 최신 응답은 그대로 반환합니다.
        }
      }
      return response;
    } catch (e) {
      // 오프라인 또는 네트워크 실패 시 캐시 fallback
      const cached = await cache.match(req);
      if (cached) return cached;

      if (req.mode === 'navigate') {
        const cachedIndex = await cache.match('./index.html') || await cache.match('./');
        if (cachedIndex) return cachedIndex;
        return new Response(
          '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>오프라인</title><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:28px;line-height:1.6;background:#F5F5F7;color:#1C1C1E"><h2>오프라인 상태예요</h2><p>네트워크 연결 후 다시 열어 주세요.</p></body></html>',
          {status: 503, headers: {'Content-Type': 'text/html;charset=utf-8'}}
        );
      }

      return new Response('offline', {status: 503, statusText: 'offline'});
    }
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
