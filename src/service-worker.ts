import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

self.__precacheManifest = self.__WB_MANIFEST.concat(self.__precacheManifest || []);

precacheAndRoute(self.__precacheManifest, {});
cleanupOutdatedCaches();

// Once this activates, start handling requests through the service worker immediately.
// No need to wait for a refresh.
clientsClaim();

registerRoute(
  /https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
  new CacheFirst({
    cacheName: 'googleapis',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, purgeOnQuotaError: false }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  'GET'
);

// Since we're a single page app, route all navigation to /index.html
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  // These have their own pages (return.html)
  // This regex matches on query string too, so no anchors!
  denylist: [/return\.html/, /\.well-known/, /\.(json|wasm|js|css|png|jpg|map)(\.(gz|br))?$/],
});
registerRoute(navigationRoute);

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
