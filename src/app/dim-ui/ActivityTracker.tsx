import _ from 'lodash';
import React from 'react';
import { loadingTracker } from '../shell/loading-tracker';
import { refresh as triggerRefresh, refresh$ } from '../shell/refresh';
import { isDragging } from '../inventory/DraggableInventoryItem';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { dimNeedsUpdate } from 'app/register-service-worker';
import { reloadDIM } from 'app/whats-new/WhatsNewLink';

const MIN_REFRESH_INTERVAL = 1 * 1000;
const AUTO_REFRESH_INTERVAL = 30 * 1000;

/**
 * The activity tracker watches for user activity on the page, and periodically fires
 * refresh events if the page is visible and has been interacted with.
 */
export class ActivityTracker extends React.Component {
  private refreshAccountDataInterval?: number;
  private refreshSubscription: Subscription;

  // Broadcast the refresh signal no more than once per minute
  private refresh = _.throttle(
    () => {
      // Individual pages should listen to this event and decide what to refresh,
      // and their services should decide how to cache/dedup refreshes.
      // This event should *NOT* be listened to by services!
      // TODO: replace this with an observable?
      triggerRefresh();
    },
    MIN_REFRESH_INTERVAL,
    { trailing: false }
  );

  componentDidMount() {
    document.addEventListener('visibilitychange', this.visibilityHandler);
    document.addEventListener('online', this.refreshAccountData);

    this.startTimer();

    // Every time we refresh for any reason, reset the timer
    this.refreshSubscription = refresh$.subscribe(() => {
      this.clearTimer();
      this.startTimer();
    });
  }

  componentWillUnmount() {
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    document.removeEventListener('online', this.refreshAccountData);
    this.clearTimer();
    this.refreshSubscription.unsubscribe();
  }

  render() {
    return null;
  }

  private startTimer() {
    this.refreshAccountDataInterval = window.setTimeout(
      this.refreshAccountData,
      AUTO_REFRESH_INTERVAL
    );
  }

  private clearTimer() {
    window.clearTimeout(this.refreshAccountDataInterval);
  }

  private visibilityHandler = () => {
    if (!document.hidden) {
      this.refreshAccountData();
    } else if (dimNeedsUpdate) {
      // Sneaky updates - if DIM is hidden and needs an update, do the update.
      reloadDIM();
    }
  };

  // Decide whether to refresh. If the page isn't visible or the user isn't online, or the page has been forgotten, don't fire.
  private refreshAccountData = () => {
    const dimHasNoActivePromises = !loadingTracker.active();
    const isDimVisible = !document.hidden;
    const isOnline = navigator.onLine;
    const notDragging = !isDragging;

    if (dimHasNoActivePromises && isDimVisible && isOnline && notDragging) {
      this.refresh();
    } else if (!dimHasNoActivePromises) {
      // Try again once the loading tracker goes back to inactive
      loadingTracker.active$
        .pipe(
          filter((active) => !active),
          take(1)
        )
        .toPromise()
        .then(this.refreshAccountData);
    } else {
      // If we didn't refresh because things were disabled, keep the timer going
      this.clearTimer();
      this.startTimer();
    }
  };
}
