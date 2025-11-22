// Self-destructing service worker
// This SW immediately unregisters itself and clears all caches
// to fix issues with stale cached content

self.addEventListener('install', () => {
  console.log('[SW] Self-destruct SW installed, skipping waiting...');
  self.skipWaiting();
});

self.addEventListener('activate', async (event) => {
  console.log('[SW] Self-destruct SW activating, clearing all caches...');

  event.waitUntil(
    (async () => {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );

      // Unregister this service worker
      const registration = await self.registration;
      console.log('[SW] Unregistering service worker...');
      await registration.unregister();
      console.log('[SW] Service worker unregistered successfully');

      // Notify all clients to reload
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => {
        console.log('[SW] Notifying client to reload');
        client.postMessage({ type: 'SW_UNREGISTERED' });
      });
    })()
  );
});

// Don't intercept any requests - let them pass through to network
self.addEventListener('fetch', () => {
  // Do nothing - let all requests go to network
});
