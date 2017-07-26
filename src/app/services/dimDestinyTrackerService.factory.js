import angular from 'angular';
import { ReviewDataCache } from '../destinyTrackerApi/reviewDataCache';
import { TrackerErrorHandler } from '../destinyTrackerApi/trackerErrorHandler';
import { BulkFetcher } from '../destinyTrackerApi/bulkFetcher';
import { ReviewsFetcher } from '../destinyTrackerApi/reviewsFetcher';
import { ReviewSubmitter } from '../destinyTrackerApi/reviewSubmitter';
import { ReviewReporter } from '../destinyTrackerApi/reviewReporter';
import { UserFilter } from '../destinyTrackerApi/userFilter';

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
  const _reviewSubmitter = new ReviewSubmitter($q, $http, dimPlatformService, _trackerErrorHandler, loadingTracker, _reviewDataCache);
  const _reviewReporter = new ReviewReporter($q, $http, dimPlatformService, _trackerErrorHandler, loadingTracker, _reviewDataCache);

  return {
    reattachScoresFromCache: function(stores) {
      _bulkFetcher.attachRankings(null,
                                  stores);
    },
    updateCachedUserRankings: function(item,
                                       userReview) {
      _reviewDataCache.addUserReviewData(item,
                                         userReview);
    },
    updateVendorRankings: function(vendors) {
      if (dimSettingsService.showReviews) {
        _bulkFetcher.bulkFetchVendorItems(vendors);
      }
    },
    getItemReviews: function(item) {
      if (dimSettingsService.allowIdPostToDtr) {
        _reviewsFetcher.getItemReviews(item);
      }
    },
    submitReview: function(item) {
      if (dimSettingsService.allowIdPostToDtr) {
        _reviewSubmitter.submitReview(item);
      }
    },
    fetchReviews: function(stores) {
      if (dimSettingsService.showReviews) {
        _bulkFetcher.bulkFetch(stores);
      }
    },
    reportReview: function(review) {
      if (dimSettingsService.allowIdPostToDtr) {
        _reviewReporter.reportReview(review);
      }
    }
  };
}
