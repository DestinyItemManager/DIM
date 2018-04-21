import { BehaviorSubject } from "rxjs/BehaviorSubject";
import './app/rx-operators';
import { reportException } from "./app/exceptions";

/** Whether a new service worker has been installed */
const serviceWorkerUpdated$ = new BehaviorSubject(false);
/** Whether workbox has reported *any* new cached files */
const contentChanged$ = new BehaviorSubject(false);

/**
 * Whether there is new content available if you reload DIM.
 *
 * We only need to update when there's new cached content and
 */
// TODO: mix in version updates from server-provided JSON as well, so we don't require service workers
export const dimNeedsUpdate$ = serviceWorkerUpdated$
  .combineLatest(contentChanged$, (updated, changed) => updated && changed)
  .distinctUntilChanged();

/**
 * If Service Workers are supported, install our Service Worker and listen for updates.
 */
export default function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  navigator.serviceWorker
    .register('/service-worker.js')
    .then((registration) => {
      // If we have access to the broadcast channel API, use that to listen
      // for whether there are actual content updates from Workbox.
      if ('BroadcastChannel' in window) {
        const updateChannel = new BroadcastChannel('precache-updates');

        const updateMessage = () => {
          contentChanged$.next(true);
          updateChannel.removeEventListener('message', updateMessage);
          updateChannel.close();
        };

        updateChannel.addEventListener('message', updateMessage);
      } else {
        // We have to assume a newly installed service worker means new content. This isn't
        // as good since we may say we updated when the content is the same.
        contentChanged$.next(true);
      }

      // TODO: save off a handler that can call registration.update() to force update on refresh?
      registration.onupdatefound = () => {
        if ($featureFlags.debugSW) {
          console.log('SW: A new Service Worker version has been found...');
        }
        const installingWorker = registration.installing!;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the old content will have been purged and
              // the fresh content will have been added to the cache.
              // It's the perfect time to display a "New content is
              // available; please refresh." message in your web app.
              console.log('SW: New content is available; please refresh.');
              // At this point, is it really cached??

              serviceWorkerUpdated$.next(true);
            } else {
              // At this point, everything has been precached.
              // It's the perfect time to display a
              // "Content is cached for offline use." message.
              if ($featureFlags.debugSW) {
                console.log('SW: Content is cached for offline use.');
              }
            }
          } else {
            if ($featureFlags.debugSW) {
              console.log('SW: New Service Worker state: ', installingWorker.state);
            }
          }
        };
      };
    })
    .catch((err) => {
      console.error('SW: Unable to register service worker.', err);
      reportException('service-worker', err);
    });
}
