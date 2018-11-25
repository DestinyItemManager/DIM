import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import './app/rx-operators';
import { reportException } from './app/exceptions';
import { Observable } from 'rxjs/Observable';

/**
 * A function that will attempt to update the service worker in place.
 * It will return a promise for when the update is complete.
 * If service workers are not enabled or installed, this is a no-op.
 */
let updateServiceWorker = () => Promise.resolve();

/** Whether a new service worker has been installed */
const serviceWorkerUpdated$ = new BehaviorSubject(false);
/** Whether workbox has reported *any* new cached files */
const contentChanged$ = new BehaviorSubject(false);

/**
 * An observable for what version the server thinks is current.
 * This is to handle cases where folks have DIM open for a long time.
 * It will attempt to update the service worker before reporting true.
 */
const serverVersionChanged$ = Observable.timer(10 * 1000, 15 * 60 * 1000)
  // Fetch but swallow errors
  .switchMap(() =>
    Observable.fromPromise(getServerVersion()).catch(() => Observable.empty<string>())
  )
  .map(isNewVersion)
  .distinctUntilChanged()
  // At this point the value of the observable will flip to true once and only once
  .switchMap((needsUpdate) =>
    needsUpdate
      ? Observable.fromPromise(updateServiceWorker().then(() => true))
      : Observable.of(false)
  )
  .shareReplay();

/**
 * Whether there is new content available if you reload DIM.
 *
 * We only need to update when there's new content and we've already updated the service worker.
 */
export const dimNeedsUpdate$ = Observable.combineLatest(
  serverVersionChanged$,
  serviceWorkerUpdated$,
  contentChanged$,
  (serverVersionChanged, updated, changed) => serverVersionChanged || (updated && changed)
).distinctUntilChanged();

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
              console.log('SW: New content is available; please refresh. (from onupdatefound)');
              // At this point, is it really cached??

              serviceWorkerUpdated$.next(true);

              let preventDevToolsReloadLoop;
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                // Ensure refresh is only called once.
                // This works around a bug in "force update on reload".
                if (preventDevToolsReloadLoop) {
                  return;
                }
                preventDevToolsReloadLoop = true;
                window.location.reload();
              });
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

      updateServiceWorker = () => {
        return registration
          .update()
          .catch((err) => {
            if ($featureFlags.debugSW) {
              console.error('SW: Unable to update service worker.', err);
            }
          })
          .then(() => {
            console.log('SW: New content is available; please refresh. (from update)');
            serviceWorkerUpdated$.next(true);
          });
      };
    })
    .catch((err) => {
      console.error('SW: Unable to register service worker.', err);
      reportException('service-worker', err);
    });
}

/**
 * Fetch a file on the server that contains the currently uploaded version number.
 */
async function getServerVersion() {
  const response = await fetch('/version.json');
  if (response.ok) {
    const data = await response.json();
    if (!data.version) {
      throw new Error('No version property');
    }
    return data.version as string;
  } else {
    throw response;
  }
}

function isNewVersion(version: string) {
  const parts = version.split('.');
  const currentVersionParts = $DIM_VERSION.split('.');

  for (let i = 0; i < parts.length && i < currentVersionParts.length; i++) {
    if (parseInt(parts[i], 10) > parseInt(currentVersionParts[i], 10)) {
      return true;
    }
  }

  return false;
}
