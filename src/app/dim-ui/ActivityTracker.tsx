import * as _ from 'lodash';
import * as React from 'react';
import { loadingTracker } from '../shell/loading-tracker';
import { refresh as triggerRefresh, refresh$ } from '../shell/refresh';
import { Subscription } from 'rxjs/Subscription';
import { isDragging } from '../inventory/DraggableInventoryItem';

const MIN_REFRESH_INTERVAL = 10 * 1000;
const AUTO_REFRESH_INTERVAL = 30 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

/**
 * The activity tracker watches for user activity on the page, and periodically fires
 * refresh events if the page is visible and has been interacted with.
 */
export class ActivityTracker extends React.Component {
  private refreshAccountDataInterval?: number;
  private lastActivityTimestamp: number;
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
    this.track();
    document.addEventListener('click', this.clickHandler);
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
    document.removeEventListener('click', this.clickHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    document.removeEventListener('online', this.refreshAccountData);
    this.clearTimer();
    this.refreshSubscription.unsubscribe();
  }

  render() {
    return null;
  }

  private track() {
    this.lastActivityTimestamp = Date.now();
  }

  private activeWithinTimespan(timespan) {
    return Date.now() - this.lastActivityTimestamp <= timespan;
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

  private clickHandler = () => {
    this.track();
  };

  private visibilityHandler = () => {
    if (document.hidden === false) {
      this.track();
      this.refreshAccountData();
    }
  };

  // Decide whether to refresh. If the page isn't visible or the user isn't online, or the page has been forgotten, don't fire.
  private refreshAccountData = () => {
    const dimHasNoActivePromises = !loadingTracker.active();
    const userWasActiveInTheLastHour = this.activeWithinTimespan(ONE_HOUR);
    const isDimVisible = !document.hidden;
    const isOnline = navigator.onLine;
    const notDragging = !isDragging;

    if (
      dimHasNoActivePromises &&
      userWasActiveInTheLastHour &&
      isDimVisible &&
      isOnline &&
      notDragging
    ) {
      this.refresh();
    }
  };
}
