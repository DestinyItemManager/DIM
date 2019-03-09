import { ReviewDataCache } from '../destinyTrackerApi/reviewDataCache';
import { BulkFetcher } from '../destinyTrackerApi/bulkFetcher';
import { getItemReviewsD1 } from '../destinyTrackerApi/reviewsFetcher';
import { ReviewReporter } from '../destinyTrackerApi/reviewReporter';
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';
import { D2ReviewReporter } from '../destinyTrackerApi/d2-reviewReporter';
import { settings } from '../settings/settings';
import { getActivePlatform } from '../accounts/platform.service';
import { D2BulkFetcher } from '../destinyTrackerApi/d2-bulkFetcher';
import {
  DestinyVendorSaleItemComponent,
  DestinyVendorItemDefinition
} from 'bungie-api-ts/destiny2';
import { DimStore, D2Store, D1Store } from '../inventory/store-types';
import { DimItem } from '../inventory/item-types';
import { WorkingD2Rating, D2ItemUserReview } from './d2-dtr-api-types';
import { WorkingD1Rating, D1ItemUserReview } from './d1-dtr-api-types';
import { DimUserReview } from './dtr-api-types';
import { Vendor } from '../vendors/vendor.service';
import { getItemReviewsD2 } from '../destinyTrackerApi/d2-reviewsFetcher';
import { ThunkResult } from '../store/reducers';
import { submitReview as doSubmitReview } from '../destinyTrackerApi/reviewSubmitter';

/** Redux thunk action that populates item reviews for an item if necessary. */
export function getItemReviews(item: DimItem): ThunkResult<Promise<any>> {
  if (settings.allowIdPostToDtr) {
    if (item.isDestiny1()) {
      return getItemReviewsD1(item);
    } else if (item.isDestiny2()) {
      const platformSelection = settings.reviewsPlatformSelection;
      const mode = settings.reviewsModeSelection;
      return getItemReviewsD2(item, platformSelection, mode);
    }
  }
  return () => Promise.resolve();
}

/** Redux thunk action that submits a review. */
export function submitReview(
  item: DimItem,
  userReview?: WorkingD1Rating | WorkingD2Rating
): ThunkResult<Promise<any>> {
  if (settings.allowIdPostToDtr) {
    const membershipInfo = getActivePlatform();

    return doSubmitReview(item, membershipInfo, userReview);
  }
  return () => Promise.resolve();
}

/**
 * Tools for interacting with the DTR-provided item ratings.
 *
 * The global instance of this can be imported as dimDestinyTrackerService
 */
export class DestinyTrackerService {
  private _reviewDataCache = new ReviewDataCache();
  private _bulkFetcher = new BulkFetcher(this._reviewDataCache);
  private _reviewReporter = new ReviewReporter(this._reviewDataCache);

  private _d2reviewDataCache = new D2ReviewDataCache();
  private _d2bulkFetcher = new D2BulkFetcher(this._d2reviewDataCache);
  private _d2reviewReporter = new D2ReviewReporter(this._d2reviewDataCache);

  async bulkFetchVendorItems(vendorSaleItems: DestinyVendorSaleItemComponent[]): Promise<this> {
    if (settings.showReviews) {
      const platformSelection = settings.reviewsPlatformSelection;
      const mode = settings.reviewsModeSelection;
      await this._d2bulkFetcher.bulkFetchVendorItems(platformSelection, mode, vendorSaleItems);
      return this;
    }

    return this;
  }

  async bulkFetchKioskItems(vendorItems: DestinyVendorItemDefinition[]): Promise<this> {
    if (settings.showReviews) {
      const platformSelection = settings.reviewsPlatformSelection;
      const mode = settings.reviewsModeSelection;
      await this._d2bulkFetcher.bulkFetchVendorItems(
        platformSelection,
        mode,
        undefined,
        vendorItems
      );
      return this;
    }

    return this;
  }

  async updateVendorRankings(vendors: { [key: number]: Vendor }) {
    if (settings.showReviews) {
      this._bulkFetcher.bulkFetchVendorItems(vendors);
    }
  }

  async fetchReviews(stores: DimStore[]) {
    if (!settings.showReviews || !stores || !stores[0]) {
      return;
    }

    if (stores[0].isDestiny1()) {
      return this._bulkFetcher.bulkFetch(stores as D1Store[]);
    } else if (stores[0].isDestiny2()) {
      const platformSelection = settings.reviewsPlatformSelection;
      const mode = settings.reviewsModeSelection;
      return this._d2bulkFetcher.bulkFetch(stores as D2Store[], platformSelection, mode);
    }
  }

  async reportReview(review: DimUserReview) {
    if (settings.allowIdPostToDtr) {
      const membershipInfo = getActivePlatform();

      if (membershipInfo) {
        if (membershipInfo.destinyVersion === 1) {
          return this._reviewReporter.reportReview(review as D1ItemUserReview, membershipInfo);
        } else if (membershipInfo.destinyVersion === 2) {
          return this._d2reviewReporter.reportReview(review as D2ItemUserReview, membershipInfo);
        }
      }
    }
  }

  clearCache() {
    this._d2reviewDataCache.clearAllItems();
  }
}

export const dimDestinyTrackerService = new DestinyTrackerService();
