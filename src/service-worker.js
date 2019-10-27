self.__precacheManifest = [].concat(self.__precacheManifest || []);

workbox.precaching.addPlugins([new workbox.broadcastUpdate.Plugin('precache-updates')]);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
workbox.precaching.cleanupOutdatedCaches();

workbox.routing.registerRoute(
  /https:\/\/fonts.(googleapis|gstatic).com\/.*/,
  new workbox.strategies.CacheFirst({
    cacheName: 'googleapis',
    plugins: [
      new workbox.expiration.Plugin({ maxEntries: 20, purgeOnQuotaError: false }),
      new workbox.cacheableResponse.Plugin({ statuses: [0, 200] })
    ]
  }),
  'GET'
);

self.addEventListener('message', (event) => {
  if (!event.data) {
    return;
  }

  switch (event.data) {
    case 'skipWaiting':
      workbox.core.skipWaiting();
      break;
    default:
      // NOOP
      break;
  }
});
