const CACHE_NAME = "beanhub-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/creators.html",
  "/to-do.html",
  "/trivia.html",
  "/manifest.json",
  "/style.css",
  "/script.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install event → cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event → serve cached files if available
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Activate event → clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
});
