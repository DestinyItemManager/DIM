import { autoRefreshEnabledSelector } from 'app/inventory/selectors';
import { dimNeedsUpdate$, reloadDIM } from 'app/register-service-worker';
import { hasSearchQuerySelector } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { useEventBusListener } from 'app/utils/hooks';
import { EventBus } from 'app/utils/observable';
import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { isDragging$ } from '../inventory/drag-events';
import { loadingTracker } from '../shell/loading-tracker';
import { refresh$, refresh as triggerRefresh } from '../shell/refresh-events';
import { sheetsOpen } from './sheets-open';

const globalSettingsSelector = (state: RootState) => state.dimApi.globalSettings;

// An intermediate trigger that means we should think about refreshing. This gets us
// out of some circular dependencies and decouples the triggering of "we might want to refresh"
// from the decision of whether to actually refresh.
const tryRefresh$ = new EventBus<undefined>();
function triggerTryRefresh() {
  tryRefresh$.next(undefined);
}

/**
 * All the AutoRefresh component does is play host to the useAutoRefresh hook. It's still
 * a component so that whenever useAutoRefresh triggers a re-render it's only re-rendering this
 * component and not the whole app.
 */
export default function AutoRefresh() {
  useAutoRefresh();
  return null;
}

/**
 * Watch the state of the page and fire refresh signals when appropriate. This pauses the auto
 * refresh when the page isn't visible or when it's on the wrong page, throttles refreshes, and
 * does other things to be nice to the API.
 */
function useAutoRefresh() {
  const { pathname } = useLocation();
  const onOptimizerPage = pathname.endsWith('/optimizer');

  // Throttle calls to refresh to no more often than destinyProfileMinimumRefreshInterval
  const throttledRefresh = useThrottledRefresh();

  // A timer for auto refreshing on a schedule, if that's enabled.
  const startTimer = useScheduledAutoRefresh();

  // When we go online, refresh
  useOnlineRefresh();

  // When the page changes visibility, maybe refresh
  useVisibilityRefresh();

  // Listen to the signal to try to refresh, and decide whether to actually refresh.
  // If the page isn't visible or the user isn't online, or the page has been forgotten, don't fire.
  useEventBusListener(
    tryRefresh$,
    useCallback(() => {
      const hasActivePromises = loadingTracker.active();
      const isVisible = !document.hidden;
      const isOnline = navigator.onLine;
      const currentlyDragging = isDragging$.getCurrentValue();

      if (
        !hasActivePromises &&
        isVisible &&
        isOnline &&
        !currentlyDragging &&
        // Don't auto reload on the optimizer page, it makes it recompute all the time
        !onOptimizerPage
      ) {
        throttledRefresh(); // Trigger the refresh assuming we haven't just refreshed
      } else if (hasActivePromises) {
        // We were blocked by active promises (transfers, etc.) Try again once
        // the loading tracker goes back to inactive.
        const unsubscribe = loadingTracker.active$.subscribe((active) => {
          if (!active) {
            unsubscribe();
            // Trigger the event bus which will run the most recent version of this handler
            triggerTryRefresh();
          }
        });
      } else if (currentlyDragging) {
        // Same deal as above, but waiting for the drag to end
        const unsubscribe = isDragging$.subscribe((dragging) => {
          if (!dragging) {
            unsubscribe();
            // Trigger the event bus which will run the most recent version of this handler
            triggerTryRefresh();
          }
        });
      } else {
        // If we didn't refresh because of any of the conditions above, restart the timer to try again next time
        startTimer();
      }
    }, [onOptimizerPage, throttledRefresh, startTimer]),
  );
}

/**
 * If autoRefresh is on, ping triggerTryRefresh on a fixed interval. This isn't literally a setInterval
 * because we want the timing to be between actual refreshes.
 */
function useScheduledAutoRefresh() {
  const { destinyProfileRefreshInterval } = useSelector(globalSettingsSelector);
  const autoRefresh = useSelector(autoRefreshEnabledSelector);

  // A timer for auto refreshing on a schedule, if that's enabled.
  const refreshAccountDataInterval = useRef<number>(0);

  const clearTimer = () => window.clearTimeout(refreshAccountDataInterval.current);

  const startTimer = useCallback(() => {
    // Cancel any ongoing timer before restarting
    clearTimer();
    if (autoRefresh) {
      refreshAccountDataInterval.current = window.setTimeout(
        triggerTryRefresh,
        destinyProfileRefreshInterval * 1000,
      );
    }
  }, [autoRefresh, destinyProfileRefreshInterval]);

  // Every time we refresh for any reason, restart the timer
  useEventBusListener(refresh$, startTimer);

  // Start the timer right away
  useEffect(() => {
    startTimer();
    return () => clearTimer();
  }, [startTimer]);

  return startTimer;
}

/**
 * Make a function that will call triggerRefresh (the real refresh signal that pages listen to) only
 * once per destinyProfileMinimumRefreshInterval.
 */
function useThrottledRefresh() {
  const { destinyProfileMinimumRefreshInterval } = useSelector(globalSettingsSelector);
  const lastRefreshTimestamp = useRef(0);
  const refresh = useCallback(() => {
    if (Date.now() - lastRefreshTimestamp.current < destinyProfileMinimumRefreshInterval * 1000) {
      return;
    }
    // Ping the refresh$ event bus, which pages can listen to to actually perform data refreshing
    triggerRefresh();
    lastRefreshTimestamp.current = Date.now();
  }, [destinyProfileMinimumRefreshInterval]);
  return refresh;
}

/**
 * Trigger a refresh attempt when the browser goes online or offline (the
 * refresh handler will not refresh if it's offline).
 */
function useOnlineRefresh() {
  useEffect(() => {
    document.addEventListener('online', triggerTryRefresh);
    return () => {
      document.removeEventListener('online', triggerTryRefresh);
    };
  }, []);
}

// TODO: https://developer.mozilla.org/en-US/docs/Web/API/Idle_Detection_API

/**
 * Trigger a refresh attempt whenever the page becomes visible. This also includes
 * "sneaky updates" where DIM will try to reload itself if it becomes invisible while
 * it needs an update.
 *
 * We try not to do the sneaky update when the user is in the middle of something (sheets, etc)
 *
 * TODO: Chrome can and will also kill tabs randomly now to save memory. They suggest apps store state in IDB and
 * restore it on load instead (there's a flag you can read to see if you were killed automatically).
 */
function useVisibilityRefresh() {
  const { refreshProfileOnVisible } = useSelector(globalSettingsSelector);
  const hasSearchQuery = useSelector(hasSearchQuerySelector);
  const { pathname } = useLocation();
  const onOptimizerPage = pathname.endsWith('/optimizer');

  useEffect(() => {
    const visibilityHandler = () => {
      if (!document.hidden) {
        if (refreshProfileOnVisible) {
          triggerTryRefresh();
        }
      } else if (
        dimNeedsUpdate$.getCurrentValue() &&
        // Don't wipe out a user's in-progress search
        !hasSearchQuery &&
        // Loadout optimizer is all about state, don't reload it
        !onOptimizerPage &&
        // If a sheet is up, the user is doing something. We check sheetsOpen here, because it is not reactive!
        sheetsOpen.open <= 0
      ) {
        // Sneaky updates - if DIM is hidden and needs an update, do the update.
        reloadDIM();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    return () => {
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, [hasSearchQuery, onOptimizerPage, refreshProfileOnVisible]);
}
