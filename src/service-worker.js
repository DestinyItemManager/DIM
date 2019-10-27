self.__precacheManifest = [].concat(self.__precacheManifest || []);

workbox.precaching.addPlugins([new workbox.broadcastUpdate.Plugin('precache-updates')]);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
workbox.precaching.cleanupOutdatedCaches();

// Once this activates, start handling requests through the service worker immediately.
// No need to wait for a refresh.
workbox.core.clientsClaim();

workbox.routing.registerRoute(
  /https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
  new workbox.strategies.CacheFirst({
    cacheName: 'googleapis',
    plugins: [
      new workbox.expiration.Plugin({ maxEntries: 20, purgeOnQuotaError: false }),
      new workbox.cacheableResponse.Plugin({ statuses: [0, 200] })
    ]
  }),
  'GET'
);

// Try providing offline access to Bungie data?
workbox.routing.registerRoute(
  /https:\/\/www\.bungie\.net\/Platform\/.*/,
  new workbox.strategies.NetworkFirst({
    cacheName: 'bungienet',
    networkTimeoutSeconds: 14
  }),
  'GET'
);

// Since we're a single page app, route all navigations to /index.html
workbox.routing.registerNavigationRoute(
  // Assuming '/single-page-app.html' has been precached,
  // look up its corresponding cache key.
  workbox.precaching.getCacheKeyForURL('/index.html'),
  {
    // These have their own pages (return.html and gdrive-return.html)
    blacklist: [new RegExp('return.html$')]
  }
);

self.addEventListener('message', (event) => {
  if (!event.data) {
    return;
  }

  switch (event.data) {
    case 'skipWaiting':
      self.skipWaiting();
      break;
    default:
      // NOOP
      break;
  }
});
