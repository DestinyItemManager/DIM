import { ReviewDataCache } from '../destinyTrackerApi/reviewDataCache';
import { BulkFetcher } from '../destinyTrackerApi/bulkFetcher';
import { ReviewsFetcher } from '../destinyTrackerApi/reviewsFetcher';
import { ReviewSubmitter } from '../destinyTrackerApi/reviewSubmitter';
import { ReviewReporter } from '../destinyTrackerApi/reviewReporter';
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';
import { D2ReviewsFetcher } from '../destinyTrackerApi/d2-reviewsFetcher';
import { D2ReviewSubmitter } from '../destinyTrackerApi/d2-reviewSubmitter';
import { D2ReviewReporter } from '../destinyTrackerApi/d2-reviewReporter';
import { settings } from '../settings/settings';
import { getActivePlatform } from '../accounts/platform.service';
import { D2BulkFetcher } from '../destinyTrackerApi/d2-bulkFetcher';
import { DestinyVendorSaleItemComponent, DestinyVendorItemDefinition } from 'bungie-api-ts/destiny2';
import { IPromise } from 'angular';
import { $q } from 'ngimport';
import { UserFilter } from '../destinyTrackerApi/userFilter';
import { DimStore, D2Store, D1Store } from '../inventory/store-types';
import { DimItem } from '../inventory/item-types';
import { D2ItemReviewResponse, WorkingD2Rating } from './d2-dtr-api-types';
import { WorkingD1Rating } from './d1-dtr-api-types';

export interface DestinyTrackerServiceType {
  bulkFetchVendorItems(vendorSaleItems: DestinyVendorSaleItemComponent[]): Promise<DestinyTrackerServiceType>;
  bulkFetchKioskItems(vendorItems: DestinyVendorItemDefinition[]): Promise<DestinyTrackerServiceType>;
  reattachScoresFromCache(stores: any | DimStore[]): void;
  updateCachedUserRankings(item: DimItem, userReview: WorkingD1Rating | WorkingD2Rating);
  updateVendorRankings(vendors: any);
  getItemReviews(item: any | DimItem);
  getItemReviewAsync(itemHash: number): IPromise<D2ItemReviewResponse>;
  submitReview(item: DimItem);
  fetchReviews(stores: any | DimStore[]);
  reportReview(review: any);
  clearIgnoredUsers();
  clearCache();
  getD2ReviewDataCache(): D2ReviewDataCache;
}

export function DestinyTrackerService(): DestinyTrackerServiceType {
  'ngInject';

  const _reviewDataCache = new ReviewDataCache();
  const _bulkFetcher = new BulkFetcher(_reviewDataCache);
  const _reviewsFetcher = new ReviewsFetcher(_reviewDataCache);
  const _reviewSubmitter = new ReviewSubmitter(_reviewDataCache);
  const _reviewReporter = new ReviewReporter(_reviewDataCache);

  const _d2reviewDataCache = new D2ReviewDataCache();
  const _d2bulkFetcher = new D2BulkFetcher(_d2reviewDataCache);
  const _d2reviewsFetcher = new D2ReviewsFetcher(_d2reviewDataCache);
  const _d2reviewSubmitter = new D2ReviewSubmitter(_d2reviewDataCache);
  const _d2reviewReporter = new D2ReviewReporter(_d2reviewDataCache);

  function _isDestinyOne() {
    return (settings.destinyVersion === 1);
  }

  function _isDestinyTwo() {
    return (settings.destinyVersion === 2);
  }

  return {
    reattachScoresFromCache(stores: DimStore[]): void {
      if (!stores || !stores[0]) {
        return;
      }

      if (stores[0].isDestiny1()) {
        _bulkFetcher.attachRankings(null,
                                    stores as D1Store[]);
      } else if (stores[0].isDestiny2()) {
        _d2bulkFetcher.attachRankings(null,
                                      stores as D2Store[]);
      }
    },

    updateCachedUserRankings(item: DimItem, userReview: WorkingD1Rating | WorkingD2Rating) {
      if (item.isDestiny1()) {
        _reviewDataCache.addUserReviewData(item,
                                           userReview as WorkingD1Rating);
      } else if (item.isDestiny2()) {
        _d2reviewDataCache.addUserReviewData(item,
                                             userReview as WorkingD2Rating);
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

      return $q.when(this);
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

      return $q.when(this);
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

    getItemReviews(item: DimItem) {
      if (settings.allowIdPostToDtr) {
        if (item.isDestiny1()) {
          _reviewsFetcher.getItemReviews(item);
        } else if (item.isDestiny2()) {
          const platformSelection = settings.reviewsPlatformSelection;
          const mode = settings.reviewsModeSelection;
          _d2reviewsFetcher.getItemReviews(item, platformSelection, mode);
        }
      }
    },

    submitReview(item: DimItem) {
      if (settings.allowIdPostToDtr) {
        const membershipInfo = getActivePlatform();

        if (item.isDestiny1()) {
          _reviewSubmitter.submitReview(item, membershipInfo);
        } else if (item.isDestiny2()) {
          _d2reviewSubmitter.submitReview(item, membershipInfo);
        }
      }
    },

    fetchReviews(stores: DimStore[]) {
      if (!settings.showReviews ||
          !stores ||
          !stores[0]) {
        return;
      }

      if (stores[0].isDestiny1()) {
        _bulkFetcher.bulkFetch(stores as D1Store[]);
      } else if (stores[0].isDestiny2()) {
        const platformSelection = settings.reviewsPlatformSelection;
        const mode = settings.reviewsModeSelection;
        _d2bulkFetcher.bulkFetch(stores as D2Store[], platformSelection, mode);
      }
    },

    getItemReviewAsync(itemHash: number): IPromise<D2ItemReviewResponse> {
      if (settings.allowIdPostToDtr) {
        if (_isDestinyOne()) {
          console.error("This is a D2-only call.");
        } else if (_isDestinyTwo()) {
          const platformSelection = settings.reviewsPlatformSelection;
          const mode = settings.reviewsModeSelection;
          return _d2reviewsFetcher.fetchItemReviews(itemHash, platformSelection, mode);
        }
      }
      return $q.when(this);
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
      const userFilter = new UserFilter();
      userFilter.clearIgnoredUsers();
    },
    clearCache() {
      if (_isDestinyTwo()) {
        _d2reviewDataCache.clearAllItems();
      }
    }
  };
}
