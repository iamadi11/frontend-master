// Service Worker for Frontend Master
// Native implementation using standard Web APIs

const CACHE_VERSION = "v1";
const CACHE_NAME = `frontend-master-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

// Assets to cache on install
const PRECACHE_URLS = ["/", "/offline", "/manifest.webmanifest"];

// Cache strategies
const CACHE_FIRST = "cache-first";
const NETWORK_FIRST = "network-first";
const STALE_WHILE_REVALIDATE = "stale-while-revalidate";

// Route patterns and their strategies
const ROUTE_STRATEGIES = [
  // Static assets - cache first
  {
    pattern: /\/_next\/static\/.*\.js$/,
    strategy: CACHE_FIRST,
    cacheName: "next-static-js",
  },
  {
    pattern: /\/_next\/static\/.*\.css$/,
    strategy: CACHE_FIRST,
    cacheName: "next-static-css",
  },
  {
    pattern: /\/_next\/static\/media\/.*/,
    strategy: CACHE_FIRST,
    cacheName: "next-static-media",
  },
  {
    pattern: /\/_next\/image\?url=.*/,
    strategy: STALE_WHILE_REVALIDATE,
    cacheName: "next-images",
  },

  // Images
  {
    pattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
    strategy: STALE_WHILE_REVALIDATE,
    cacheName: "images",
  },

  // Fonts
  {
    pattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
    strategy: CACHE_FIRST,
    cacheName: "fonts",
  },

  // Google Fonts
  {
    pattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
    strategy: STALE_WHILE_REVALIDATE,
    cacheName: "google-fonts-css",
  },
  {
    pattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
    strategy: CACHE_FIRST,
    cacheName: "google-fonts-files",
  },

  // API routes - network first
  { pattern: /\/api\/.*/, strategy: NETWORK_FIRST, cacheName: "api-routes" },

  // Pages - network first with offline fallback
  {
    pattern: /^https?:\/\/[^/]+\/.*/,
    strategy: NETWORK_FIRST,
    cacheName: "pages",
  },
];

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log(
          "[ServiceWorker] Pre-caching offline page and essential assets"
        );
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName.startsWith("frontend-master-") &&
              cacheName !== CACHE_NAME
            ) {
              console.log("[ServiceWorker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle requests with appropriate strategies
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip chrome extensions and other schemes
  if (!event.request.url.startsWith("http")) {
    return;
  }

  // Handle navigation preload for navigation requests
  if (event.request.mode === "navigate" && event.preloadResponse) {
    const preloadPromise = event.preloadResponse;

    event.respondWith(
      (async () => {
        try {
          // Wait for preload response to settle
          const preloadResponse = await preloadPromise;
          if (preloadResponse) {
            return handleFetch(event.request, preloadResponse);
          }
        } catch (error) {
          console.log("[ServiceWorker] Preload failed, falling back:", error);
        }
        return handleFetch(event.request);
      })()
    );

    // Ensure preload promise settles (prevents cancellation warning)
    event.waitUntil(preloadPromise.catch(() => {}));
  } else {
    event.respondWith(handleFetch(event.request));
  }
});

// Main fetch handler
async function handleFetch(request, preloadResponse = null) {
  const url = new URL(request.url);

  // If we have a preload response, use it for navigation requests
  if (preloadResponse && request.mode === "navigate") {
    try {
      // Check if preload response is valid
      if (preloadResponse.ok) {
        // Cache it for offline use
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, preloadResponse.clone());
        return preloadResponse;
      }
    } catch (error) {
      console.log(
        "[ServiceWorker] Preload response invalid, falling back:",
        error
      );
    }
  }

  // Find matching strategy
  const route = ROUTE_STRATEGIES.find((r) => r.pattern.test(url.href));

  if (route) {
    return handleWithStrategy(request, route.strategy, route.cacheName);
  }

  // Default to network first for same-origin requests
  if (url.origin === location.origin) {
    return handleWithStrategy(request, NETWORK_FIRST, CACHE_NAME);
  }

  // For cross-origin, try network only
  return fetch(request);
}

// Strategy handlers
async function handleWithStrategy(request, strategy, cacheName) {
  switch (strategy) {
    case CACHE_FIRST:
      return cacheFirst(request, cacheName);
    case NETWORK_FIRST:
      return networkFirst(request, cacheName);
    case STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName);
    default:
      return fetch(request);
  }
}

// Cache First strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error("[ServiceWorker] Cache first failed:", error);
    throw error;
  }
}

// Network First strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log("[ServiceWorker] Network failed, trying cache:", request.url);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // If it's a navigation request and we have an offline page, show it
    if (request.mode === "navigate") {
      const offlinePage = await cache.match(OFFLINE_URL);
      if (offlinePage) {
        return offlinePage;
      }
    }

    throw error;
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.log("[ServiceWorker] Revalidation failed:", error);
      return null;
    });

  // Return cached response immediately, or wait for network
  return cached || fetchPromise;
}

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_URLS") {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.payload);
      })
    );
  }
});
