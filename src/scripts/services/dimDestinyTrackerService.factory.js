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
  var _reviewDataCache = new ReviewDataCache();
  var _trackerErrorHandler = new TrackerErrorHandler($q, $translate);
  var _bulkFetcher = new BulkFetcher($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache);
  var _reviewsFetcher = new ReviewsFetcher($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache);
  var _reviewSubmitter = new ReviewSubmitter($q, $http, dimPlatformService, _trackerErrorHandler, loadingTracker, _reviewDataCache);

  $rootScope.$on('item-clicked', function(event, item) {
    _reviewsFetcher.getItemReviews(item);
  });

  $rootScope.$on('dim-stores-updated', function(event, stores) {
    _bulkFetcher.bulkFetch(stores);
  });

  $rootScope.$on('review-submitted', function(event, item) {
    _reviewSubmitter.submitReview(item);
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
    }
  };
}
