const BOOK_CACHE = 'bza-books-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

// Only intercept book content downloads for offline caching
// Let everything else (pages, API, assets) go through normally
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Only cache Supabase storage book downloads
  if (url.pathname.includes('/storage/v1/object/') && url.pathname.includes('/books/')) {
    event.respondWith(
      caches.open(BOOK_CACHE).then(async cache => {
        try {
          const response = await fetch(event.request)
          if (response.ok) cache.put(event.request, response.clone())
          return response
        } catch {
          const cached = await cache.match(event.request)
          return cached || new Response('Offline', { status: 503 })
        }
      })
    )
  }
  // Everything else — don't intercept, let browser handle normally
})
