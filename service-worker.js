// ============================================================
//  VERSIÓN DEL SERVICE WORKER  —  v7 "Offline Bulletproof"
//  👉 Para publicar una nueva versión: incrementa este número (v7 -> v8 ...).
//     Al cambiar el CACHE_NAME, el navegador detecta el nuevo Service Worker,
//     instala la nueva caché y avisa al usuario mediante el modal de actualización.
//     Recuerda actualizar también APP_VERSION y el CHANGELOG en anchoralarm3.html.
// ============================================================
const CACHE_NAME = 'sailing-religion-anchor-alarm-v8';

// IMPORTANTE: solo se listan archivos que EXISTEN en el repositorio. La app usa
// 'logosr.png' como icono (declarado en manifest.json); NO usa archivos icon-*.png.
const urlsToCache = [
  './',
  './index.html',
  './anchoralarm3.html',
  './manifest.json',
  './service-worker.js',
  './logosr.png',
  './alarm_sailing_religion.mp3'
];

// ============================================================
//  INSTALL — Cachear todo con TOLERANCIA a fallos.
//  Usamos cache.add() por archivo dentro de Promise.allSettled para que, si un
//  archivo falla al descargar (señal intermitente en el puerto/marina), los demás
//  SÍ se guarden y la app pueda abrir offline. Luego skipWaiting() para activar ya.
// ============================================================
self.addEventListener('install', event => {
  console.log('[SW] Installing v7...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching files...');
        return Promise.allSettled(
          urlsToCache.map(url =>
            cache.add(url).catch(err => {
              console.warn('[SW] Failed to cache:', url, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Cache complete');
        return self.skipWaiting(); // Activar inmediatamente
      })
  );
});

// ============================================================
//  ACTIVATE — Limpiar cachés antiguos y TOMAR CONTROL inmediato.
//  clients.claim() hace que este SW controle la página actual sin necesidad de
//  una segunda recarga, protegiendo incluso la primera visita.
// ============================================================
self.addEventListener('activate', event => {
  console.log('[SW] Activating v7...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Taking control...');
      return self.clients.claim(); // Tomar control inmediato
    })
  );
});

// ============================================================
//  FETCH — Offline-first con FALLBACK ROBUSTO.
//  1) Buscar en caché ignorando query strings (?source=pwa) y cabeceras Vary.
//  2) Si no está, intentar red y cachear la respuesta válida para el futuro.
//  3) Si la red falla SIN conexión:
//       - Si es una navegación (abrir la app), servir el app-shell cacheado.
//       - Si no, devolver una respuesta 503 controlada (nunca el error del navegador).
// ============================================================
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, {
      ignoreSearch: true,  // Ignorar ?source=pwa y similares
      ignoreVary: true
    })
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // No está en caché, intentar red.
        return fetch(event.request)
          .then(networkResponse => {
            // Si la respuesta es válida, cachear para futuro.
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(error => {
            console.log('[SW] Network failed, using fallback:', error);

            // FALLBACK — Si es navegación, servir la app principal cacheada.
            if (event.request.mode === 'navigate') {
              return caches.match('./anchoralarm3.html', { ignoreSearch: true });
            }

            // Si falla todo, dar una respuesta controlada (no el error del navegador).
            return new Response('Offline - Please ensure app was opened once with internet', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// ============================================================
//  AUTO-ACTUALIZACIÓN
//  Escucha mensajes desde la página (anchoralarm3.html). Cuando el usuario
//  pulsa "Actualizar ahora", la página envía { type: 'SKIP_WAITING' } y aquí
//  forzamos al nuevo Service Worker a activarse inmediatamente. Tras activarse,
//  dispara 'controllerchange' en la página, que recarga la app con la versión nueva.
// ============================================================
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING recibido, activando nueva versión...');
    self.skipWaiting();
  }
});
