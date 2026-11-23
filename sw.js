// Solo cachea el propio panel (/mis-apps/). Cada app usa su propio service worker.
const CACHE = 'mis-apps-v12';
const ARCHIVOS = ['./', 'index.html', 'estilos.css', 'app.js', 'manifest.json', 'icono.svg', 'icono-192.png', 'icono-512.png',
  'fuentes/serif-400.woff2', 'fuentes/sans-400.woff2', 'fuentes/sans-500.woff2', 'fuentes/sans-600.woff2', 'fuentes/sans-700.woff2',
  'iconos/dia.svg', 'iconos/habitos.svg', 'iconos/compra.svg', 'iconos/mascota.svg', 'iconos/viajes.svg', 'iconos/tickets.svg', 'iconos/pedidos.svg', 'iconos/pronos.svg'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('mis-apps-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Red primero (sin caché HTTP) y, si no hay conexión, la copia guardada
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then((r) => {
      if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
