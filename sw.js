const VERSION = '1.4.1';
const CACHE = `forma-static-${VERSION}`;
const CORE = [
  './', './index.html', './manifest.webmanifest', './src/styles.css',
  './src/main.js', './src/platform.js', './src/data.js', './src/storage.js', './src/engine.js',
  './src/gestures.js', './src/reminders.js', './src/migrations.js', './public/icons/icon.svg', './public/icons/dumbbell-mark.svg', './public/icons/icon-192.png',
  './public/icons/icon-512.png', './README.md', './PRIVACY.md',
  './OFFLINE_CAPABILITIES.md', './THIRD_PARTY_LICENSES.md'
];
const scoped = path => new URL(path, self.registration.scope).toString();

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE.map(scoped));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('forma-static-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        if (fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(scoped('./index.html'), fresh.clone());
        }
        return fresh;
      } catch {
        return (await caches.match(request)) || (await caches.match(scoped('./index.html')));
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      return new Response('Recurso no disponible sin conexión.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});


self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target=event.notification.data?.url || self.registration.scope;
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if('focus' in client){if('navigate' in client)await client.navigate(target);return client.focus();}
    }
    if(self.clients.openWindow)return self.clients.openWindow(target);
  })());
});
