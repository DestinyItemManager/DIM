import { ReviewDataCache } from '../destinyTrackerApi/reviewDataCache';
import { TrackerErrorHandler } from '../destinyTrackerApi/trackerErrorHandler';
import { BulkFetcher } from '../destinyTrackerApi/bulkFetcher';
import { ReviewsFetcher } from '../destinyTrackerApi/reviewsFetcher';
import { ReviewSubmitter } from '../destinyTrackerApi/reviewSubmitter';
import { ReviewReporter } from '../destinyTrackerApi/reviewReporter';
import { UserFilter } from '../destinyTrackerApi/userFilter';

import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';
import { D2ReviewsFetcher } from '../destinyTrackerApi/d2-reviewsFetcher';
import { D2ReviewSubmitter } from '../destinyTrackerApi/d2-reviewSubmitter';
import { D2TrackerErrorHandler } from '../destinyTrackerApi/d2-trackerErrorHandler';
import { D2ReviewReporter } from '../destinyTrackerApi/d2-reviewReporter';
import { SyncService } from '../storage/sync.service';
import { settings } from '../settings/settings';
import { getActivePlatform } from '../accounts/platform.service';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { D2BulkFetcher } from '../destinyTrackerApi/d2-bulkFetcher';
import { DtrUserReview } from '../destinyTrackerApi/d2-dtr-class-defs';
import { DimItem } from '../inventory/store/d2-item-factory.service';

export function DestinyTrackerService(
  $q,
  $http,
  $i18next,
  loadingTracker
) {
  'ngInject';

  const _reviewDataCache = new ReviewDataCache();
  const _userFilter = new UserFilter(SyncService);
  const _trackerErrorHandler = new TrackerErrorHandler($q, $i18next);
  const _bulkFetcher = new BulkFetcher($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache);
  const _reviewsFetcher = new ReviewsFetcher($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache, _userFilter);
  const _reviewSubmitter = new ReviewSubmitter($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache);
  const _reviewReporter = new ReviewReporter($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache, _userFilter);

  const _d2reviewDataCache = new D2ReviewDataCache();
  const _d2trackerErrorHandler = new D2TrackerErrorHandler($q, $i18next);
  const _d2bulkFetcher = new D2BulkFetcher($q, $http, _d2trackerErrorHandler, loadingTracker, _d2reviewDataCache);
  const _d2reviewsFetcher = new D2ReviewsFetcher($q, $http, _d2trackerErrorHandler, loadingTracker, _d2reviewDataCache, _userFilter);
  const _d2reviewSubmitter = new D2ReviewSubmitter($q, $http, _d2trackerErrorHandler, loadingTracker, _d2reviewDataCache);
  const _d2reviewReporter = new D2ReviewReporter($q, $http, _d2trackerErrorHandler, loadingTracker, _d2reviewDataCache, _userFilter);

  function _isDestinyOne() {
    return (settings.destinyVersion === 1);
  }

  function _isDestinyTwo() {
    return (settings.destinyVersion === 2);
  }

  return {
    reattachScoresFromCache(stores) {
      if (!stores || !stores[0]) {
        return;
      }

      if (stores[0].destinyVersion === 1) {
        _bulkFetcher.attachRankings(null,
                                    stores);
      } else if (stores[0].destinyVersion === 2) {
        _d2bulkFetcher.attachRankings(null,
                                      stores as DimStore[]);
      }
    },

    updateCachedUserRankings(item, userReview) {
      if (_isDestinyOne()) {
        _reviewDataCache.addUserReviewData(item,
                                           userReview);
      } else if (_isDestinyTwo()) {
        _d2reviewDataCache.addUserReviewData(item,
                                             userReview);
      }
    },

    updateVendorRankings(vendors) {
      if (settings.showReviews) {
        if (_isDestinyOne()) {
          _bulkFetcher.bulkFetchVendorItems(vendors);
        } else if (_isDestinyTwo()) {
          console.log("update vendor for D2 called");
        }
      }
    },

    getItemReviews(item) {
      if (settings.allowIdPostToDtr) {
        if (_isDestinyOne()) {
          _reviewsFetcher.getItemReviews(item);
        } else if (_isDestinyTwo()) {
          const platformSelection = settings.reviewsPlatformSelection;
          _d2reviewsFetcher.getItemReviews(item, platformSelection);
        }
      }
    },

    submitReview(item) {
      if (settings.allowIdPostToDtr) {
        const membershipInfo = getActivePlatform();

        if (_isDestinyOne()) {
          _reviewSubmitter.submitReview(item, membershipInfo);
        } else if (_isDestinyTwo()) {
          _d2reviewSubmitter.submitReview(item, membershipInfo);
        }
      }
    },

    fetchReviews(stores) {
      if (!settings.showReviews ||
          !stores ||
          !stores[0]) {
        return;
      }

      if (stores[0].destinyVersion === 1) {
        _bulkFetcher.bulkFetch(stores);
      } else if (stores[0].destinyVersion === 2) {
        const platformSelection = settings.reviewsPlatformSelection;
        _d2bulkFetcher.bulkFetch(stores, platformSelection);
      }
    },

    reportReview(review) {
      if (settings.allowIdPostToDtr) {
        const membershipInfo = getActivePlatform();

        if (_isDestinyOne()) {
          _reviewReporter.reportReview(review, membershipInfo);
        } else if (_isDestinyTwo()) {
          _d2reviewReporter.reportReview(review, membershipInfo);
        }
      }
    },
    clearIgnoredUsers() {
      _userFilter.clearIgnoredUsers();
    },
    clearCache() {
      if (_isDestinyTwo()) {
        _d2reviewDataCache.clearAllItems();
      }
    }
  };
}
