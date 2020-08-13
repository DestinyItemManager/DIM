import { getItemReviewsD1 } from '../destinyTrackerApi/reviewsFetcher';
import { getActivePlatform } from '../accounts/get-active-platform';
import {
  bulkFetch as bulkFetchD2,
  bulkFetchVendorItems as bulkFetchD2VendorItems,
} from '../destinyTrackerApi/d2-bulkFetcher';
import {
  DestinyVendorSaleItemComponent,
  DestinyVendorItemDefinition,
} from 'bungie-api-ts/destiny2';
import { DimStore, D2Store, D1Store } from '../inventory/store-types';
import { DimItem } from '../inventory/item-types';
import { WorkingD2Rating } from './d2-dtr-api-types';
import { WorkingD1Rating } from './d1-dtr-api-types';
import { DimUserReview, DtrRating } from './dtr-api-types';
import { Vendor } from '../destiny1/vendors/vendor.service';
import { getItemReviewsD2 } from '../destinyTrackerApi/d2-reviewsFetcher';
import { ThunkResult } from 'app/store/types';
import { submitReview as doSubmitReview } from '../destinyTrackerApi/reviewSubmitter';
import {
  bulkFetchVendorItems as bulkFetchD1VendorItems,
  bulkFetch as bulkFetchD1,
} from '../destinyTrackerApi/bulkFetcher';
import { reportReview as doReportReview } from '../destinyTrackerApi/reviewReporter';
import { settingsSelector } from 'app/settings/reducer';
import { storesSelector } from 'app/inventory/selectors';

/** Redux thunk action that populates item reviews for an item if necessary. */
export function getItemReviews(item: DimItem): ThunkResult<any> {
  return async (dispatch, getState) => {
    const settings = settingsSelector(getState());
    if (settings.allowIdPostToDtr) {
      if (item.isDestiny1()) {
        return dispatch(getItemReviewsD1(item));
      } else if (item.isDestiny2()) {
        const platformSelection = settings.reviewsPlatformSelectionV2;
        const mode = settings.reviewsModeSelection;
        return dispatch(getItemReviewsD2(item, platformSelection, mode));
      }
    }
  };
}

/** Redux thunk action that submits a review. */
export function submitReview(
  item: DimItem,
  userReview?: WorkingD1Rating | WorkingD2Rating
): ThunkResult<any> {
  return async (dispatch, getState) => {
    if (settingsSelector(getState()).allowIdPostToDtr) {
      const membershipInfo = getActivePlatform();

      return dispatch(doSubmitReview(item, membershipInfo, userReview));
    }
  };
}

export function bulkFetchVendorItems(
  vendorSaleItems: DestinyVendorSaleItemComponent[]
): ThunkResult<DtrRating[]> {
  return async (dispatch, getState) => {
    const settings = settingsSelector(getState());
    if (settings.showReviews) {
      const platformSelection = settings.reviewsPlatformSelectionV2;
      const mode = settings.reviewsModeSelection;
      return dispatch(bulkFetchD2VendorItems(platformSelection, mode, vendorSaleItems));
    }
    return [];
  };
}

export function bulkFetchKioskItems(
  vendorItems: DestinyVendorItemDefinition[]
): ThunkResult<DtrRating[]> {
  return async (dispatch, getState) => {
    const settings = settingsSelector(getState());
    if (settings.showReviews) {
      const platformSelection = settings.reviewsPlatformSelectionV2;
      const mode = settings.reviewsModeSelection;
      return dispatch(bulkFetchD2VendorItems(platformSelection, mode, undefined, vendorItems));
    }
    return [];
  };
}

export function updateVendorRankings(vendors: { [key: number]: Vendor }): ThunkResult<DtrRating[]> {
  return async (dispatch, getState) => {
    const settings = settingsSelector(getState());
    if (settings.showReviews) {
      return dispatch(bulkFetchD1VendorItems(vendors));
    }
    return [];
  };
}

export function fetchRatings(stores?: DimStore[]): ThunkResult<DtrRating[]> {
  return async (dispatch, getState) => {
    if (!stores) {
      stores = storesSelector(getState());
    }
    const settings = settingsSelector(getState());
    if (!settings.showReviews || !stores || !stores[0]) {
      return [];
    }

    if (stores[0].isDestiny1()) {
      return dispatch(bulkFetchD1(stores as D1Store[]));
    } else if (stores[0].isDestiny2()) {
      const platformSelection = settings.reviewsPlatformSelectionV2;
      const mode = settings.reviewsModeSelection;
      return dispatch(bulkFetchD2(stores as D2Store[], platformSelection, mode));
    }

    return [];
  };
}

export function reportReview(review: DimUserReview): ThunkResult<any> {
  return async (_dispatch, getState) => {
    if (settingsSelector(getState()).allowIdPostToDtr) {
      const membershipInfo = getActivePlatform();

      if (membershipInfo) {
        // TODO: dispatch actions to update state in reaction to report
        doReportReview(review, membershipInfo);
      }
    }
  };
}
