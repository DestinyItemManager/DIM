import { dimNeedsUpdate$, reloadDIM } from 'app/register-service-worker';
import { hasSearchQuerySelector } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { useEventBusListener } from 'app/utils/hooks';
import { EventBus } from 'app/utils/observable';
import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { isDragging } from '../inventory/DraggableInventoryItem';
import { loadingTracker } from '../shell/loading-tracker';
import { refresh as triggerRefresh, refresh$ } from '../shell/refresh';

const globalSettingsSelector = (state: RootState) => state.dimApi.globalSettings;

// An intermediate trigger that means we should think about refreshing. This gets us
// out of some circular dependencies and decouples the triggering of "we might want to refresh"
// from the decision of whether to actually refresh.
const tryRefresh$ = new EventBus<undefined>();
function triggerTryRefresh() {
  tryRefresh$.next(undefined);
}

/**
 * Watch the state of the page and fire refresh signals when appropriate. This pauses the auto
 * refresh when the page isn't visible or when it's on the wrong page, throttles refreshes, and
 * does other things to be nice to the API.
 */
export function useAutoRefresh() {
  const {
    destinyProfileMinimumRefreshInterval,
    destinyProfileRefreshInterval,
    autoRefresh,
    refreshProfileOnVisible,
  } = useSelector(globalSettingsSelector);
  const hasSearchQuery = useSelector(hasSearchQuerySelector);

  const { pathname } = useLocation();
  // Don't auto reload on the optimizer page, it makes it recompute all the time
  const onOptimizer = pathname.endsWith('/optimizer');

  // Throttle calls to refresh to no more often than destinyProfileMinimumRefreshInterval
  const lastRefreshTimestamp = useRef(0);
  const refresh = useCallback(() => {
    if (Date.now() - lastRefreshTimestamp.current < destinyProfileMinimumRefreshInterval * 1000) {
      return;
    }
    // Ping the refresh$ event bus, which pages can listen to to actually perform data refreshing
    triggerRefresh();
    lastRefreshTimestamp.current = Date.now();
  }, [destinyProfileMinimumRefreshInterval]);

  // A timer for auto refreshing on a schedule, if that's enabled.
  const refreshAccountDataInterval = useRef<number>();
  const clearTimer = () => window.clearTimeout(refreshAccountDataInterval.current);
  const startTimer = useCallback(() => {
    // Cancel any ongoing timer before restarting
    clearTimer();
    if (autoRefresh) {
      refreshAccountDataInterval.current = window.setTimeout(
        triggerTryRefresh,
        destinyProfileRefreshInterval * 1000
      );
    }
  }, [autoRefresh, destinyProfileRefreshInterval]);

  // Every time we refresh for any reason, reset the timer
  useEventBusListener(refresh$, startTimer);

  // Start the refresh timer immediately, and clear it on unmount
  useEffect(() => {
    startTimer();
    return () => clearTimer();
  }, [startTimer]);

  // Listen to the signal to try to refresh, and decide whether to actually refresh.
  // If the page isn't visible or the user isn't online, or the page has been forgotten, don't fire.
  useEventBusListener(
    tryRefresh$,
    useCallback(() => {
      const hasActivePromises = loadingTracker.active();
      const isVisible = !document.hidden;
      const isOnline = navigator.onLine;

      if (!hasActivePromises && isVisible && isOnline && !isDragging && !onOptimizer) {
        refresh();
      } else if (hasActivePromises) {
        // Try again once the loading tracker goes back to inactive
        const unsubscribe = loadingTracker.active$.subscribe((active) => {
          if (!active) {
            unsubscribe();
            triggerTryRefresh();
          }
        });
      } else {
        // If we didn't refresh because things were disabled, restart the timer
        startTimer();
      }
    }, [onOptimizer, refresh, startTimer])
  );

  // When we go online, refresh
  useEffect(() => {
    document.addEventListener('online', triggerTryRefresh);
    return () => {
      document.removeEventListener('online', triggerTryRefresh);
    };
  }, []);

  // When the page changes visibility, maybe refresh
  useEffect(() => {
    const visibilityHandler = () => {
      if (!document.hidden) {
        if (refreshProfileOnVisible) {
          triggerTryRefresh();
        }
      } else if (dimNeedsUpdate$.getCurrentValue() && !hasSearchQuery) {
        // Sneaky updates - if DIM is hidden and needs an update, do the update.
        reloadDIM();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    return () => {
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, [hasSearchQuery, refreshProfileOnVisible]);
}

function useScheduledAutoRefresh() {
  const { destinyProfileRefreshInterval, autoRefresh } = useSelector(globalSettingsSelector);
  // A timer for auto refreshing on a schedule, if that's enabled.
  const refreshAccountDataInterval = useRef<number>();
  const clearTimer = () => window.clearTimeout(refreshAccountDataInterval.current);
  const startTimer = useCallback(() => {
    // Cancel any ongoing timer before restarting
    clearTimer();
    if (autoRefresh) {
      refreshAccountDataInterval.current = window.setTimeout(
        triggerTryRefresh,
        destinyProfileRefreshInterval * 1000
      );
    }
  }, [autoRefresh, destinyProfileRefreshInterval]);

  // Every time we refresh for any reason, reset the timer
  useEventBusListener(refresh$, startTimer);

  return startTimer;
}
