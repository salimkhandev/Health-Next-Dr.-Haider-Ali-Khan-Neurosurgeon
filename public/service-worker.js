// IlmPath Service Worker
const CACHE_VERSION = 'V13';
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;

// Static shell pages to pre-cache on install — these must work fully offline
const PRECACHE_URLS = [
  '/',
  '/manifest',
  '/downloads',
  '/about',
  '/terms',
  '/refund',
  '/privacy',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isSameOriginGET(request) {
  return request.method === 'GET' && request.url.startsWith(self.location.origin);
}

// Routes that must always hit the network — auth-gated, sensitive, or highly dynamic
function shouldBypass(url) {
  return (
    url.includes('/api/') ||           // all API routes bypass SW entirely
    url.includes('/admin') ||          // admin panel — auth-gated, always fresh
    url.includes('/payment') ||
    url.includes('/login') ||
    url.includes('/register') ||
    url.includes('/forgot-password') ||
    url.includes('/reset-password') ||
    url.includes('/_next/webpack-hmr') || // HMR dev-only
    url.includes('hot-update') ||         // Next.js HMR files
    url.includes('/_next/static/webpack/') // Next.js webpack metadata
  );
}

// Content-hashed Next.js static assets — safe to cache permanently
function isImmutableAsset(url) {
  return url.includes('/_next/static/');
}



// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of PRECACHE_URLS) {
        try {
          await cache.add(new Request(url, { cache: 'reload' }));
        } catch (err) {
          console.warn('[SW] Pre-cache failed for', url, err);
        }
      }
    })
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  // Delete all caches from previous SW versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  // Do NOT call clients.claim() — skipWaiting() + claim() together cause a race
  // that interrupts in-flight fetches on existing tabs (empty JSON responses).
  // SW takes control naturally on the next navigation.
  console.log('[SW] Activated — cache:', CACHE_NAME);
});

// ─── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  if (!isSameOriginGET(request)) return;
  if (shouldBypass(url)) return;

  // ── Strategy 1: Cache-first (immutable assets) ────────────────────────────
  // /_next/static/* files are content-hashed — once cached they never change.
  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone)).catch(() => {});
          }
          return res;
        });
      })
    );
    return;
  }

  // ── Strategy 2: Network-first (dynamic student pages, _next/image, etc.) ──
  // Always try the network; only fall back to cache when offline.
  event.respondWith(
    fetch(request)
      .then((res) => {
        // Aggressive caching removed to ensure ONLY explicitly downloaded items are cached
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.headers.get('accept')?.includes('text/html')) {
          return offlineHtmlFallback();
        }
        // JSON sentinel so callers don't throw "Unexpected end of JSON input"
        return new Response(
          JSON.stringify({ error: 'offline', message: 'You are offline.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
  );
});

// ─── Offline HTML fallback ────────────────────────────────────────────────────

async function offlineHtmlFallback() {
  const cached = await caches.match('/');
  return (
    cached ||
    new Response(
      '<html><body><p>You are offline. Please check your connection.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    )
  );
}

// ─── Messages ────────────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  const msg = event.data || {};

  if (msg.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (msg.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() =>
          self.clients.matchAll({ includeUncontrolled: true }).then((clients) =>
            clients.forEach((c) => c.postMessage({ type: 'CACHES_CLEARED' }))
          )
        )
    );
  }
});
