// ============================================================
//  VERSIÓN DEL SERVICE WORKER
//  👉 Para publicar una nueva versión: incrementa este número (v3 -> v4 ...).
//     Al cambiar el CACHE_NAME, el navegador detecta el nuevo Service Worker,
//     instala la nueva caché y avisa al usuario mediante el modal de actualización.
//     Recuerda actualizar también el CHANGELOG en anchoralarm3.html.
// ============================================================
const CACHE_NAME = 'anchor-alarm-sailingreligion-v4';
const urlsToCache = [
  './anchoralarm3.html',
  './manifest.json',
  './logosr.png',
  './alarm_sailing_religion.mp3'
];

// Instalar Service Worker y guardar archivos en caché
self.addEventListener('install', function(event) {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Archivos guardados en caché');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar Service Worker y limpiar cachés antiguos
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activado');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando caché antiguo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar peticiones y servir desde caché cuando no hay internet
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Si está en caché, devolverlo; si no, intentar descargarlo
        if (response) {
          console.log('Service Worker: Sirviendo desde caché', event.request.url);
          return response;
        }
        return fetch(event.request);
      })
  );
});

// ============================================================
//  AUTO-ACTUALIZACIÓN
//  Escucha mensajes desde la página (anchoralarm3.html). Cuando el usuario
//  pulsa "Actualizar ahora", la página envía { type: 'SKIP_WAITING' } y aquí
//  forzamos al nuevo Service Worker a activarse inmediatamente (sin esperar a
//  que se cierren todas las pestañas). Tras activarse, dispara 'controllerchange'
//  en la página, que recarga la app con la versión nueva.
// ============================================================
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: SKIP_WAITING recibido, activando nueva versión...');
    self.skipWaiting();
  }
});