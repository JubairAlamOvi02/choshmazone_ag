// Service Worker for Choshma Zone PWA
const CACHE_NAME = 'choshma-zone-v1';
const STATIC_CACHE = 'choshma-static-v1';
const DYNAMIC_CACHE = 'choshma-dynamic-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip cross-origin requests (except for images from Supabase)
    if (url.origin !== location.origin && !url.hostname.includes('supabase')) {
        return;
    }

    // Handle API requests - Network only (no caching)
    if (url.pathname.includes('/rest/') || url.pathname.includes('/auth/')) {
        return;
    }

    // Handle image requests - Cache first
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        // Return cached image, but update cache in background
                        fetch(request)
                            .then((response) => {
                                if (response.ok) {
                                    caches.open(DYNAMIC_CACHE)
                                        .then((cache) => cache.put(request, response));
                                }
                            })
                            .catch(() => { });
                        return cachedResponse;
                    }

                    // Not in cache, fetch and cache
                    return fetch(request)
                        .then((response) => {
                            if (response.ok) {
                                const responseClone = response.clone();
                                caches.open(DYNAMIC_CACHE)
                                    .then((cache) => cache.put(request, responseClone));
                            }
                            return response;
                        });
                })
        );
        return;
    }

    // Handle other requests - Network first, fallback to cache
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then((cache) => cache.put(request, responseClone));
                }
                return response;
            })
            .catch(() => {
                return caches.match(request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }

                        // Return offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('/');
                        }

                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};

    const options = {
        body: data.body || 'New notification from Choshma Zone',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
        },
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Choshma Zone', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // If a window is already open, focus it
                for (const client of clientList) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});
