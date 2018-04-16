import { BehaviorSubject } from "rxjs/BehaviorSubject";

// TODO: Move this elsewhere, and drive it off of server JSON as well
export const dimNeedsUpdate$ = new BehaviorSubject(false);

export default function registerServiceWorker() {
  navigator.serviceWorker
    .register('/service-worker.js')
    .then((registration) => {
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

              dimNeedsUpdate$.next(true);
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
    });
}
