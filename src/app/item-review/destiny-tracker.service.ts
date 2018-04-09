export interface DtrVote {
  upvotes: number;
  downvotes: number;
  total: number;
  score: number;
}

export interface DtrItem {
  referenceId: number;
  instanceId?: string;
  attachedMods?: any[] | null;
  selectedPerks?: any[] | null;
}

export interface DtrBulkItem extends DtrItem {
  votes: DtrVote;
}

export interface Reviewer {
  membershipType: number;
  membershipId: string;
  displayName: string;
}

export interface DimUserReview extends DtrBulkItem {
  reviewer: Reviewer;
  voted: number;
  pros: string;
  cons: string;
  text: string;
}

export interface DtrUserReview {
  id: string;
  timestamp: Date;
  isReviewer: boolean;
  isHighlighted: boolean;
  instanceId?: string;
  reviewer: Reviewer;
  voted: number;
  pros: string;
  cons: string;
  text: string;
  isIgnored?: boolean;
  selectedPerks: number[];
  attachedMods: number[];
  mode: DtrActivityModes;
  sandbox: number; // sandbox season (1 was the first, 2 is the March 2018 "go fast" update)
}

export interface DtrReviewContainer extends DtrBulkItem {
  totalReviews: number;
  reviews: DtrUserReview[];
}

export interface DimWorkingUserReview extends DtrReviewContainer {
  userVote: number;
  rating: number;
  userRating: number;
  mode: DtrActivityModes;
  reviewsDataFetched: boolean;
  highlightedRatingCount: number;
  review: string;
  pros: string;
  cons: string;
  votes: DtrVote;
  voted: number;
  text: string;
}

export interface DimReviewReport {
  reviewId: string;
  reporter: Reviewer;
  text: string;
}

export enum DtrActivityModes {
  notSpecified = 0,
  playerVersusEnemy = 7,
  playerVersusPlayer = 5,
  raid = 4,
  trials = 39
}

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
import { D2ReviewReporter } from '../destinyTrackerApi/d2-reviewReporter';
import { SyncService } from '../storage/sync.service';
import { settings } from '../settings/settings';
import { getActivePlatform } from '../accounts/platform.service';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { D2BulkFetcher } from '../destinyTrackerApi/d2-bulkFetcher';
import { DestinyVendorSaleItemComponent, DestinyVendorItemDefinition } from 'bungie-api-ts/destiny2';
import { DimItem } from '../inventory/store/d2-item-factory.service';
import { IPromise } from 'angular';

export interface DestinyTrackerServiceType {
  bulkFetchVendorItems(vendorSaleItems: DestinyVendorSaleItemComponent[]): Promise<DestinyTrackerServiceType>;
  bulkFetchKioskItems(vendorItems: DestinyVendorItemDefinition[]): Promise<DestinyTrackerServiceType>;
  reattachScoresFromCache(stores: any | DimStore[]): void;
  updateCachedUserRankings(item: any | DimItem, userReview: any);
  updateVendorRankings(vendors: any);
  getItemReviews(item: any | DimItem);
  getItemReviewAsync(itemHash: number): IPromise<DtrReviewContainer>;
  submitReview(item: any | DimItem);
  fetchReviews(stores: any | DimStore[]);
  reportReview(review: any);
  clearIgnoredUsers();
  clearCache();
  getD2ReviewDataCache(): D2ReviewDataCache;
}

export function DestinyTrackerService(
  $q,
  $http,
  $i18next,
  loadingTracker
): DestinyTrackerServiceType {
  'ngInject';

  const _reviewDataCache = new ReviewDataCache();
  const _userFilter = new UserFilter(SyncService);
  const _trackerErrorHandler = new TrackerErrorHandler($q, $i18next);
  const _bulkFetcher = new BulkFetcher($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache);
  const _reviewsFetcher = new ReviewsFetcher($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache, _userFilter);
  const _reviewSubmitter = new ReviewSubmitter($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache);
  const _reviewReporter = new ReviewReporter($q, $http, _trackerErrorHandler, loadingTracker, _reviewDataCache, _userFilter);

  const _d2reviewDataCache = new D2ReviewDataCache();
  const _d2bulkFetcher = new D2BulkFetcher(loadingTracker, _d2reviewDataCache);
  const _d2reviewsFetcher = new D2ReviewsFetcher(loadingTracker, _d2reviewDataCache, _userFilter);
  const _d2reviewSubmitter = new D2ReviewSubmitter(loadingTracker, _d2reviewDataCache);
  const _d2reviewReporter = new D2ReviewReporter(loadingTracker, _d2reviewDataCache, _userFilter);

  function _isDestinyOne() {
    return (settings.destinyVersion === 1);
  }

  function _isDestinyTwo() {
    return (settings.destinyVersion === 2);
  }

  return {
    reattachScoresFromCache(stores: any | DimStore[]): void {
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

    async bulkFetchVendorItems(
      vendorSaleItems: DestinyVendorSaleItemComponent[]
    ): Promise<DestinyTrackerServiceType> {
      if (settings.showReviews) {
        if (_isDestinyOne()) {
          throw new Error(("This is a D2-only call."));
        } else if (_isDestinyTwo()) {
          const platformSelection = settings.reviewsPlatformSelection;
          const mode = settings.reviewsModeSelection;
          await _d2bulkFetcher.bulkFetchVendorItems(platformSelection, mode, vendorSaleItems);
          return this;
        }
      }

      return $q.when();
    },

    async bulkFetchKioskItems(
      vendorItems: DestinyVendorItemDefinition[]
    ): Promise<DestinyTrackerServiceType> {
      if (settings.showReviews) {
        if (_isDestinyOne()) {
          throw new Error(("This is a D2-only call."));
        } else if (_isDestinyTwo()) {
          const platformSelection = settings.reviewsPlatformSelection;
          const mode = settings.reviewsModeSelection;
          await _d2bulkFetcher.bulkFetchVendorItems(platformSelection, mode, undefined, vendorItems);
          return this;
        }
      }

      return $q.when();
    },

    getD2ReviewDataCache(): D2ReviewDataCache {
      return _d2bulkFetcher.getCache();
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
          const mode = settings.reviewsModeSelection;
          _d2reviewsFetcher.getItemReviews(item, platformSelection, mode);
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

    fetchReviews(stores: any | DimStore[]) {
      if (!settings.showReviews ||
          !stores ||
          !stores[0]) {
        return;
      }

      if (stores[0].destinyVersion === 1) {
        _bulkFetcher.bulkFetch(stores);
      } else if (stores[0].destinyVersion === 2) {
        const platformSelection = settings.reviewsPlatformSelection;
        const mode = settings.reviewsModeSelection;
        _d2bulkFetcher.bulkFetch(stores, platformSelection, mode);
      }
    },

    getItemReviewAsync(itemHash: number): IPromise<DtrReviewContainer> {
      if (settings.allowIdPostToDtr) {
        if (_isDestinyOne()) {
          console.error("This is a D2-only call.");
        } else if (_isDestinyTwo()) {
          const platformSelection = settings.reviewsPlatformSelection;
          const mode = settings.reviewsModeSelection;
          return _d2reviewsFetcher.fetchItemReviews(itemHash, platformSelection, mode);
        }
      }
      return $q.when({});
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
