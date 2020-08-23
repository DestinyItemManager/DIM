import _ from 'lodash';
import React from 'react';
import { loadingTracker } from '../shell/loading-tracker';
import { refresh as triggerRefresh, refresh$ } from '../shell/refresh';
import { isDragging } from '../inventory/DraggableInventoryItem';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { dimNeedsUpdate, reloadDIM } from 'app/register-service-worker';
import { connect } from 'react-redux';
import { RootState } from 'app/store/types';

interface StoreProps {
  /** Don't allow refresh more often than this many seconds. */
  destinyProfileMinimumRefreshInterval: number;
  /** Time in seconds to refresh the profile when autoRefresh is true. */
  destinyProfileRefreshInterval: number;
  /** Whether to refresh profile automatically. */
  autoRefresh: boolean;
  /** Whether to refresh profile when the page becomes visible after being in the background. */
  refreshProfileOnVisible: boolean;
  hasSearchQuery: boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  const {
    destinyProfileMinimumRefreshInterval,
    destinyProfileRefreshInterval,
    autoRefresh,
    refreshProfileOnVisible,
  } = state.dimApi.globalSettings;

  return {
    destinyProfileRefreshInterval,
    destinyProfileMinimumRefreshInterval,
    autoRefresh,
    refreshProfileOnVisible,
    hasSearchQuery: Boolean(state.shell.searchQuery),
  };
}

type Props = StoreProps;

/**
 * The activity tracker watches for user activity on the page, and periodically fires
 * refresh events if the page is visible and has been interacted with.
 */
class ActivityTracker extends React.Component<Props> {
  private lastRefreshTimestamp = 0;
  private refreshAccountDataInterval?: number;
  private refreshSubscription: Subscription;

  componentDidMount() {
    document.addEventListener('visibilitychange', this.visibilityHandler);
    document.addEventListener('online', this.refreshAccountData);

    this.startTimer();

    // Every time we refresh for any reason, reset the timer
    this.refreshSubscription = refresh$.subscribe(() => this.resetTimer());
  }

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.autoRefresh !== this.props.autoRefresh ||
      prevProps.destinyProfileRefreshInterval !== this.props.destinyProfileRefreshInterval
    ) {
      this.resetTimer();
    }
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

  private refresh() {
    if (
      Date.now() - this.lastRefreshTimestamp <
      this.props.destinyProfileMinimumRefreshInterval * 1000
    ) {
      return;
    }

    // Individual pages should listen to this event and decide what to refresh,
    // and their services should decide how to cache/dedup refreshes.
    // This event should *NOT* be listened to by services!
    // TODO: replace this with an observable?
    triggerRefresh();
    this.lastRefreshTimestamp = Date.now();
  }

  private resetTimer() {
    this.clearTimer();
    this.startTimer();
  }

  private startTimer() {
    if (this.props.autoRefresh) {
      this.refreshAccountDataInterval = window.setTimeout(
        this.refreshAccountData,
        this.props.destinyProfileRefreshInterval * 1000
      );
    }
  }

  private clearTimer() {
    window.clearTimeout(this.refreshAccountDataInterval);
  }

  private visibilityHandler = () => {
    if (!document.hidden) {
      if (this.props.refreshProfileOnVisible) {
        this.refreshAccountData();
      }
    } else if (dimNeedsUpdate && !this.props.hasSearchQuery) {
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
      this.resetTimer();
    }
  };
}

export default connect<StoreProps>(mapStateToProps)(ActivityTracker);
