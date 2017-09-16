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
  const _reviewReporter = new ReviewReporter($q, $http, dimPlatformService, _trackerErrorHandler, loadingTracker, _reviewDataCache, _userFilter);

  const _d2reviewDataCache = new D2ReviewDataCache();
  const _d2bulkFetcher = new D2BulkFetcher($q, $http, _trackerErrorHandler, loadingTracker, _d2reviewDataCache);

  return {
    isDestinyOne: function() {
      return (dimSettingsService.destinyVersion === 1);
    },
    isDestinyTwo: function() {
      return (dimSettingsService.destinyVersion === 2);
    },
    reattachScoresFromCache: function(stores) {
      if (this.isDestinyOne()) {
        _bulkFetcher.attachRankings(null,
          stores);
      }
      else if (this.isDestinyTwo()) {
        console.log("reattach D2 called");
      }
    },
    updateCachedUserRankings: function(item,
                                       userReview) {
      if (this.isDestinyOne()) {
        _reviewDataCache.addUserReviewData(item,
                                          userReview);
      }
      else if (this.isDestinyTwo()) {
        console.log("update cached D2 called");
      }
    },
    updateVendorRankings: function(vendors) {
      if (dimSettingsService.showReviews) {
        if (this.isDestinyOne()) {
          _bulkFetcher.bulkFetchVendorItems(vendors);
        }
        else if (this.isDestinyTwo()) {
          console.log("update vendor for D2 called");
        }
      }
    },
    getItemReviews: function(item) {
      if (dimSettingsService.allowIdPostToDtr) {
        _reviewsFetcher.getItemReviews(item);
      }
    },
    submitReview: function(item) {
      if (dimSettingsService.allowIdPostToDtr) {
        if (this.isDestinyOne()) {
          _reviewSubmitter.submitReview(item);
        }
        else if (this.isDestinyTwo()) {
          console.log("submit review for D2 called");
        }
      }
    },
    fetchReviews: function(stores) {
      if (dimSettingsService.showReviews) {
        if (this.isDestinyOne()) {
          _bulkFetcher.bulkFetch(stores);
        }
        else if (this.isDestinyTwo()) {
          _d2bulkFetcher.bulkFetch(stores);
        }
      }
    },
    reportReview: function(review) {
      if (dimSettingsService.allowIdPostToDtr) {
        _reviewReporter.reportReview(review);
      }
    },
    clearIgnoredUsers: function() {
      _userFilter.clearIgnoredUsers();
    }
  };
}
