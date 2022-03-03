import { getCurrentHub } from '@sentry/browser';
import { reportException } from './utils/exceptions';
import { errorLog, infoLog, warnLog } from './utils/log';
import { Observable } from './utils/observable';
import { delay } from './utils/util';

/**
 * A function that will attempt to update the service worker in place.
 * It will return a promise for when the update is complete.
 * If service workers are not enabled or installed, this is a no-op.
 */
let updateServiceWorker = async () => true;

/**
 * Whether there is new content available if you reload DIM.
 *
 * We only need to update when there's new content and we've already updated the service worker.
 */
export const dimNeedsUpdate$ = new Observable<boolean>(false);

/**
 * Poll what the server thinks is current.
 * This is to handle cases where folks have DIM open for a long time.
 * It will attempt to update the service worker before reporting that DIM needs update.
 */
// TODO: Move this state into Redux?

let currentVersion = $DIM_VERSION;

(async () => {
  await delay(10 * 1000);
  setInterval(async () => {
    try {
      const serverVersion = await getServerVersion();
      if (isNewVersion(serverVersion, currentVersion)) {
        const updated = await updateServiceWorker();
        if (updated) {
          currentVersion = serverVersion;
          dimNeedsUpdate$.next(true);
        }
      }
    } catch (e) {
      errorLog('SW', 'Failed to check version.json', e);
    }
  }, 15 * 60 * 1000);
})();

/**
 * If Service Workers are supported, install our Service Worker and listen for updates.
 */
export default function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        // TODO: save off a handler that can call registration.update() to force update on refresh?
        registration.onupdatefound = () => {
          if ($featureFlags.debugSW) {
            infoLog('SW', 'A new Service Worker version has been found...');
          }
          const installingWorker = registration.installing!;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // At this point, the old content will have been purged and
                // the fresh content will have been added to the cache.
                // It's the perfect time to display a "New content is
                // available; please refresh." message in your web app.
                infoLog('SW', 'New content is available; please refresh. (from onupdatefound)');
                // At this point, is it really cached??

                dimNeedsUpdate$.next(true);

                let preventDevToolsReloadLoop = false;
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
                  infoLog('SW', 'Content is cached for offline use.');
                }
              }
            } else {
              if ($featureFlags.debugSW) {
                infoLog('SW', 'New Service Worker state: ', installingWorker.state);
              }
            }
          };
        };

        updateServiceWorker = async () => {
          infoLog('SW', 'Checking for service worker update.');
          try {
            await registration.update();
          } catch (err) {
            if ($featureFlags.debugSW) {
              errorLog('SW', 'Unable to update service worker.', err);
              reportException('service-worker', err);
            }
            return false;
          }
          if (registration.waiting) {
            infoLog('SW', 'New content is available; please refresh. (from update)');

            if ($featureFlags.sentry) {
              // Disable Sentry error logging if this user is on an older version
              const sentryOptions = getCurrentHub()?.getClient()?.getOptions();
              if (sentryOptions) {
                sentryOptions.enabled = false;
              }
            }

            return true;
          } else {
            infoLog('SW', 'Updated, but theres not a new worker waiting');
            return false;
          }
        };
      })
      .catch((err) => {
        errorLog('SW', 'Unable to register service worker.', err);
        reportException('service-worker', err);
      });
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

export function isNewVersion(version: string, currentVersion: string) {
  const parts = version.split('.');
  const currentVersionParts = currentVersion.split('.');

  let newerAvailable = false;
  let olderAvailable = false;

  for (let i = 0; i < parts.length && i < currentVersionParts.length; i++) {
    const versionSegment = parseInt(parts[i], 10);
    const currentVersionSegment = parseInt(currentVersionParts[i], 10);
    if (versionSegment > currentVersionSegment) {
      newerAvailable = true;
      break;
    } else if (versionSegment < currentVersionSegment) {
      olderAvailable = true;
      break;
    }
  }

  if (olderAvailable) {
    warnLog('SW', 'Server version ', version, ' is older than current version ', currentVersion);
  } else if (newerAvailable) {
    infoLog('SW', 'Found newer version on server, attempting to update');
  }

  return newerAvailable;
}

/**
 * Attempt to update the service worker and reload DIM with the new version.
 */
export async function reloadDIM() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      errorLog('SW', 'No registration!');
      window.location.reload();
      return;
    }

    if (!registration.waiting) {
      // Just to ensure registration.waiting is available before
      // calling postMessage()
      errorLog('SW', 'registration.waiting is null!');

      const installingWorker = registration.installing;
      if (installingWorker) {
        infoLog('SW', 'found an installing service worker');
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            infoLog('SW', 'installing service worker installed, skip waiting');
            installingWorker.postMessage('skipWaiting');
          }
        };
      } else {
        window.location.reload();
      }
      return;
    }

    infoLog('SW', 'posting skip waiting');
    registration.waiting.postMessage('skipWaiting');

    // insurance!
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (e) {
    errorLog('SW', 'Error checking registration:', e);
    window.location.reload();
  }
}
