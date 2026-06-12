const CACHE_NAME = 'nous-ai-news-v1';
const SHELL_CACHE = 'nous-ai-news-shell-v1';
const FEED_CACHE = 'nous-ai-news-feed-v1';
const ASSET_CACHE = 'nous-ai-news-assets-v1';

const SHELL_URLS = [
  '/',
  '/feed',
  '/trending',
  '/search',
  '/offline'
];

const ASSET_EXTENSIONS = [
  '.js', '.css', '.json', '.ico', '.png', '.jpg', '.jpeg',
  '.webp', '.svg', '.woff', '.woff2', '.ttf', '.eot'
];

// Install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(SHELL_CACHE);
      await shellCache.addAll(SHELL_URLS);
      // Pre-cache the offline page
      const offlineResponse = await fetch('/offline');
      if (offlineResponse.ok) {
        await shellCache.put('/offline', offlineResponse);
      }
      // Skip waiting so the new SW activates immediately
      self.skipWaiting();
    })()
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const validCaches = [CACHE_NAME, SHELL_CACHE, FEED_CACHE, ASSET_CACHE];
      await Promise.all(
        cacheNames
          .filter((name) => !validCaches.includes(name))
          .map((name) => caches.delete(name))
      );
      // Claim all clients so the SW controls pages immediately
      await self.clients.claim();
    })()
  );
});

// Helper: is this a navigation request?
function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('Accept')?.includes('text/html'));
}

// Helper: is this an asset request?
function isAssetRequest(url) {
  const pathname = new URL(url).pathname;
  return ASSET_EXTENSIONS.some((ext) => pathname.endsWith(ext)) ||
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/fonts/');
}

// Helper: is this an API request?
function isApiRequest(url) {
  const pathname = new URL(url).pathname;
  return pathname.startsWith('/api/');
}

// Strategy: Network First with fallback to cache (for navigations and feed)
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName || CACHE_NAME);
      const clonedResponse = networkResponse.clone();
      // Don't cache opaque responses (cross-origin)
      if (clonedResponse.type === 'basic' || clonedResponse.type === 'cors') {
        cache.put(request, clonedResponse);
      }
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // If it's a navigation request, show the offline page
    if (isNavigationRequest(request)) {
      const offlineCache = await caches.open(SHELL_CACHE);
      const offlinePage = await offlineCache.match('/offline');
      if (offlinePage) {
        return offlinePage;
      }
    }
    throw error;
  }
}

// Strategy: Cache First with network update (for assets)
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName || ASSET_CACHE);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse);
      }
    }).catch(() => {});
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Strategy: Stale While Revalidate (for shell pages)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName || SHELL_CACHE);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    // If fetch fails and we have a cached response, return it
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  });
  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Fetch: route requests to appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip API requests (don't cache them)
  if (isApiRequest(url)) return;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Asset requests: cache first
  if (isAssetRequest(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // Navigation requests: network first, fallback to offline page
  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  // Feed-related pages: network first with dedicated cache
  const pathname = url.pathname;
  if (pathname === '/' || pathname.startsWith('/feed') || pathname.startsWith('/trending')) {
    event.respondWith(networkFirst(request, FEED_CACHE));
    return;
  }

  // Everything else: network first
  event.respondWith(networkFirst(request));
});

// Push event handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Nous AI News', body: event.data.text() };
  }

  const title = data.title || 'Nous AI News';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: 'Open' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
