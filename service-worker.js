const CACHE_NAME = 'anchor-alarm-sailingreligion-v1';
const urlsToCache = [
  './anchoralarm3.html',
  './logosr.png',
  './alarm_sailing_religion.wav'
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