import angular from 'angular';
import { reviewDataCache } from '../destinyTrackerApi/reviewDataCache.js';
import { trackerErrorHandler } from '../destinyTrackerApi/trackerErrorHandler.js';
import { bulkFetcher } from '../destinyTrackerApi/bulkFetcher.js';
import { reviewsFetcher } from '../destinyTrackerApi/reviewsFetcher.js';
import { reviewSubmitter } from '../destinyTrackerApi/reviewSubmitter.js';

angular.module('dimApp')
  .factory('dimDestinyTrackerService', DestinyTrackerService);

function DestinyTrackerService($q,
                               $http,
                               $rootScope,
                               dimPlatformService,
                               dimSettingsService,
                               $translate,
                               dimFeatureFlags,
                               loadingTracker) {
  var _reviewDataCache = new reviewDataCache();
  var _trackerErrorHandler = new trackerErrorHandler($q, $translate);
  var _bulkFetcher = new bulkFetcher($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache);
  var _reviewsFetcher = new reviewsFetcher($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache);
  var _reviewSubmitter = new reviewSubmitter($q, $http, dimPlatformService, _trackerErrorHandler, loadingTracker, _reviewDataCache);
  var _postEnabled = dimFeatureFlags.sendingWeaponDataEnabled;

  function _userHasNotOkayedPostingIds() {
    return (!dimSettingsService.allowIdPostToDtr);
  }

  $rootScope.$on('item-clicked', function(event, item) {
    if ((!_postEnabled) ||
        (_userHasNotOkayedPostingIds())) {
      return;
    }

    _reviewsFetcher.getItemReviews(item);
  });

  $rootScope.$on('dim-stores-updated', function(event, stores) {
    if (!_postEnabled) {
      return;
    }

    _bulkFetcher.bulkFetch(stores);
  });

  $rootScope.$on('review-submitted', function(event, item, userReview) {
    if ((!_postEnabled) ||
        (_userHasNotOkayedPostingIds())) {
      return;
    }

    _reviewSubmitter.submitReview(item, userReview);
  });

  return {
    reattachScores: function(stores) {
      _bulkFetcher.attachRankings(null,
                                  stores);
    },
    updateUserRankings: function(item,
                                 userReview) {
      _reviewDataCache.addUserReviewData(item,
                                         userReview);
    }
  };
}