import { getItemReviewsD1 } from '../destinyTrackerApi/reviewsFetcher';
import { settings } from '../settings/settings';
import { getActivePlatform } from '../accounts/platform.service';
import {
  bulkFetch as bulkFetchD2,
  bulkFetchVendorItems as bulkFetchD2VendorItems
} from '../destinyTrackerApi/d2-bulkFetcher';
import {
  DestinyVendorSaleItemComponent,
  DestinyVendorItemDefinition
} from 'bungie-api-ts/destiny2';
import { DimStore, D2Store, D1Store } from '../inventory/store-types';
import { DimItem } from '../inventory/item-types';
import { WorkingD2Rating } from './d2-dtr-api-types';
import { WorkingD1Rating } from './d1-dtr-api-types';
import { DimUserReview } from './dtr-api-types';
import { Vendor } from '../vendors/vendor.service';
import { getItemReviewsD2 } from '../destinyTrackerApi/d2-reviewsFetcher';
import { ThunkResult } from '../store/reducers';
import { submitReview as doSubmitReview } from '../destinyTrackerApi/reviewSubmitter';
import {
  bulkFetchVendorItems as bulkFetchD1VendorItems,
  bulkFetch as bulkFetchD1
} from '../destinyTrackerApi/bulkFetcher';
import { reportReview as doReportReview } from '../destinyTrackerApi/reviewReporter';

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

export async function bulkFetchVendorItems(
  vendorSaleItems: DestinyVendorSaleItemComponent[]
): Promise<any> {
  if (settings.showReviews) {
    const platformSelection = settings.reviewsPlatformSelection;
    const mode = settings.reviewsModeSelection;
    return bulkFetchD2VendorItems(platformSelection, mode, vendorSaleItems);
  }
}

export async function bulkFetchKioskItems(
  vendorItems: DestinyVendorItemDefinition[]
): Promise<any> {
  if (settings.showReviews) {
    const platformSelection = settings.reviewsPlatformSelection;
    const mode = settings.reviewsModeSelection;
    return bulkFetchD2VendorItems(platformSelection, mode, undefined, vendorItems);
  }
}

export async function updateVendorRankings(vendors: { [key: number]: Vendor }) {
  if (settings.showReviews) {
    bulkFetchD1VendorItems(vendors);
  }
}

export async function fetchRatings(stores: DimStore[]) {
  if (!settings.showReviews || !stores || !stores[0]) {
    return;
  }

  if (stores[0].isDestiny1()) {
    return bulkFetchD1(stores as D1Store[]);
  } else if (stores[0].isDestiny2()) {
    const platformSelection = settings.reviewsPlatformSelection;
    const mode = settings.reviewsModeSelection;
    return bulkFetchD2(stores as D2Store[], platformSelection, mode);
  }
}

export async function reportReview(review: DimUserReview) {
  if (settings.allowIdPostToDtr) {
    const membershipInfo = getActivePlatform();

    if (membershipInfo) {
      doReportReview(review, membershipInfo);
    }
  }
}
