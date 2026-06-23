/* Blood Bike West Command Centre — minimal service worker.
 *
 * Purpose: satisfy the browser's "installable PWA" criteria so Chrome/Android
 * fires `beforeinstallprompt` and the app can be added to the home screen.
 *
 * Deliberately NETWORK-FIRST with no offline app-shell caching. On a live
 * emergency service we never want users pinned to a stale build, so this worker
 * always fetches fresh from the network and only exists to enable installation.
 */
self.addEventListener('install', () => {
  // Activate this worker immediately rather than waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of open pages straight away.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Always go to the network. No cache is consulted or populated, so users
  // always get the latest deployed assets. (A fetch handler must exist for the
  // app to be considered installable.)
  event.respondWith(
    fetch(event.request).catch(() => Response.error())
  );
});
