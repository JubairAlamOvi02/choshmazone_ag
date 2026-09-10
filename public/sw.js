const CACHE_NAME = 'choshmazone-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
                console.warn('SW: Precache failed for some assets:', err);
            });
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    let url;
    try {
        url = new URL(event.request.url);
    } catch {
        return;
    }

    // Skip cross-origin requests
    if (url.origin !== self.location.origin) {
        return;
    }

    // Skip Vite development requests, hot updates, websocket, and API calls
    if (
        url.pathname.startsWith('/@') ||
        url.pathname.startsWith('/src/') ||
        url.pathname.startsWith('/node_modules/') ||
        url.pathname.includes('hot-update') ||
        url.pathname.startsWith('/__vite') ||
        url.pathname.startsWith('/api') ||
        url.protocol === 'ws:' ||
        url.protocol === 'wss:'
    ) {
        return;
    }

    // Handle HTML / navigation requests (Network First, fallback to cached /index.html)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(async () => {
                    try {
                        const cache = await caches.open(CACHE_NAME);
                        const cachedResponse = (await cache.match('/index.html')) || (await cache.match('/'));
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                    } catch {}
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'text/plain' }
                    });
                })
        );
        return;
    }

    // Asset / resource requests: Cache First, fallback to Network with safe error catching
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).catch(() => {
                // Return a synthetic response instead of letting the promise reject
                return new Response('', {
                    status: 408,
                    statusText: 'Network error / offline'
                });
            });
        }).catch(() => {
            return new Response('', {
                status: 408,
                statusText: 'Network error / offline'
            });
        })
    );
});
