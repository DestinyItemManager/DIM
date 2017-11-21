import angular from 'angular';
import { ReviewDataCache } from '../destinyTrackerApi/reviewDataCache';
import { TrackerErrorHandler } from '../destinyTrackerApi/trackerErrorHandler';
import { BulkFetcher } from '../destinyTrackerApi/bulkFetcher';
import { ReviewsFetcher } from '../destinyTrackerApi/reviewsFetcher';
import { ReviewSubmitter } from '../destinyTrackerApi/reviewSubmitter';
import { ReviewReporter } from '../destinyTrackerApi/reviewReporter';
import { UserFilter } from '../destinyTrackerApi/userFilter';

import { D2BulkFetcher } from '../destinyTrackerApi/d2-bulkFetcher';
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';
import { D2ReviewsFetcher } from '../destinyTrackerApi/d2-reviewsFetcher';
import { D2ReviewSubmitter } from '../destinyTrackerApi/d2-reviewSubmitter';
import { D2TrackerErrorHandler } from '../destinyTrackerApi/d2-trackerErrorHandler';
import { D2ReviewReporter } from '../destinyTrackerApi/d2-reviewReporter';

angular.module('dimApp')
  .factory('dimDestinyTrackerService', DestinyTrackerService);

function DestinyTrackerService($q,
                               $http,
                               dimPlatformService,
                               dimSettingsService,
                               $i18next,
                               loadingTracker,
                               SyncService) {
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
  const _d2reviewsFetcher = new D2ReviewsFetcher($q, $http, _d2trackerErrorHandler, loadingTracker, _d2reviewDataCache, _userFilter, dimPlatformService);
  const _d2reviewSubmitter = new D2ReviewSubmitter($q, $http, _d2trackerErrorHandler, loadingTracker, _d2reviewDataCache);
  const _d2reviewReporter = new D2ReviewReporter($q, $http, _d2trackerErrorHandler, loadingTracker, _d2reviewDataCache, _userFilter);

  function _isDestinyOne() {
    return (dimSettingsService.destinyVersion === 1);
  }

  function _isDestinyTwo() {
    return (dimSettingsService.destinyVersion === 2);
  }

  return {
    reattachScoresFromCache: function(stores) {
      if (!stores || !stores[0]) {
        return;
      }

      if (stores[0].destinyVersion === 1) {
        _bulkFetcher.attachRankings(null,
                                    stores);
      } else if (stores[0].destinyVersion === 2) {
        _d2bulkFetcher.attachRankings(null,
                                      stores);
      }
    },

    updateCachedUserRankings: function(item,
                                       userReview) {
      if (_isDestinyOne()) {
        _reviewDataCache.addUserReviewData(item,
                                           userReview);
      } else if (_isDestinyTwo()) {
        _d2reviewDataCache.addUserReviewData(item,
                                             userReview);
      }
    },

    updateVendorRankings: function(vendors) {
      if (dimSettingsService.showReviews) {
        if (_isDestinyOne()) {
          _bulkFetcher.bulkFetchVendorItems(vendors);
        } else if (_isDestinyTwo()) {
          console.log("update vendor for D2 called");
        }
      }
    },

    getItemReviews: function(item) {
      if (dimSettingsService.allowIdPostToDtr) {
        if (_isDestinyOne()) {
          _reviewsFetcher.getItemReviews(item);
        } else if (_isDestinyTwo()) {
          _d2reviewsFetcher.getItemReviews(item);
        }
      }
    },

    submitReview: function(item) {
      if (dimSettingsService.allowIdPostToDtr) {
        const membershipInfo = dimPlatformService.getActive();

        if (_isDestinyOne()) {
          _reviewSubmitter.submitReview(item, membershipInfo);
        } else if (_isDestinyTwo()) {
          _d2reviewSubmitter.submitReview(item, membershipInfo);
        }
      }
    },

    fetchReviews: function(stores) {
      if (!dimSettingsService.showReviews ||
          !stores ||
          !stores[0]) {
        return;
      }

      if (stores[0].destinyVersion === 1) {
        _bulkFetcher.bulkFetch(stores);
      } else if (stores[0].destinyVersion === 2) {
        _d2bulkFetcher.bulkFetch(stores);
      }
    },

    reportReview: function(review) {
      if (dimSettingsService.allowIdPostToDtr) {
        const membershipInfo = dimPlatformService.getActive();

        if (_isDestinyOne()) {
          _reviewReporter.reportReview(review, membershipInfo);
        } else if (_isDestinyTwo()) {
          _d2reviewReporter.reportReview(review, membershipInfo);
        }
      }
    },
    clearIgnoredUsers: function() {
      _userFilter.clearIgnoredUsers();
    }
  };
}
