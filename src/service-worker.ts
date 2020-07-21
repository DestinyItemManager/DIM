import {
  createHandlerBoundToURL,
  precacheAndRoute,
  cleanupOutdatedCaches,
} from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

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

// Since we're a single page app, route all navigations to /index.html
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  // These have their own pages (return.html and gdrive-return.html)
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
