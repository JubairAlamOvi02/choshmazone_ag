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

// ==========================================
// PWA Push Notifications & Interaction
// ==========================================

self.addEventListener('push', (event) => {
    let payload = {
        title: '💰 New Order Received!',
        body: 'A customer just placed a new order on Choshma Zone.',
        url: '/admin/orders'
    };

    try {
        if (event.data) {
            const json = event.data.json();
            payload = { ...payload, ...json };
        }
    } catch {
        if (event.data) {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        icon: '/pwa-192x192.png',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200, 100, 400],
        tag: payload.tag || 'choshmazone-order',
        renotify: true,
        data: {
            url: payload.url || '/admin/orders',
            orderId: payload.orderId || null
        },
        actions: [
            { action: 'open', title: '👁️ View Order' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const targetUrl = (event.notification.data && event.notification.data.url) 
        ? event.notification.data.url 
        : '/admin/orders';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client && client.url.includes('/admin')) {
                    if ('navigate' in client && targetUrl) {
                        client.navigate(targetUrl);
                    }
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, options } = event.data;
        self.registration.showNotification(title, {
            icon: '/pwa-192x192.png',
            badge: '/favicon.svg',
            vibrate: [200, 100, 200, 100, 400],
            ...options
        });
    }
});

