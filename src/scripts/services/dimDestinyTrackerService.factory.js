import angular from 'angular';
import { ReviewDataCache } from '../destinyTrackerApi/reviewDataCache';
import { TrackerErrorHandler } from '../destinyTrackerApi/trackerErrorHandler';
import { BulkFetcher } from '../destinyTrackerApi/bulkFetcher';
import { ReviewsFetcher } from '../destinyTrackerApi/reviewsFetcher';
import { ReviewSubmitter } from '../destinyTrackerApi/reviewSubmitter';

angular.module('dimApp')
  .factory('dimDestinyTrackerService', DestinyTrackerService);

function DestinyTrackerService($q,
  $http,
  $rootScope,
  dimPlatformService,
  dimSettingsService,
  $translate,
  loadingTracker) {
  const _reviewDataCache = new ReviewDataCache();
  const _trackerErrorHandler = new TrackerErrorHandler($q, $translate);
  const _bulkFetcher = new BulkFetcher($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache);
  const _reviewsFetcher = new ReviewsFetcher($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache);
  const _reviewSubmitter = new ReviewSubmitter($q, $http, dimPlatformService, _trackerErrorHandler, loadingTracker, _reviewDataCache);

  $rootScope.$on('dim-stores-updated', (event, stores) => {
    if (dimSettingsService.showReviews) {
      _bulkFetcher.bulkFetch(stores);
    }
  });

  $rootScope.$on('review-submitted', (event, item) => {
    if (dimSettingsService.allowIdPostToDtr) {
      _reviewSubmitter.submitReview(item);
    }
  });

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
        _bulkFetcher.bulkFetch(vendors);
      }
    },
    getItemReviews(item) {
      if (dimSettingsService.allowIdPostToDtr) {
        _reviewsFetcher.getItemReviews(item);
      }
    }
  };
}
