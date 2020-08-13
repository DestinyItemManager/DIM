import { handleErrors } from './trackerErrorHandler';
import { loadingTracker } from '../shell/loading-tracker';
import { dtrFetch } from './dtr-service-helper';
import { D1ItemFetchResponse } from '../item-review/d1-dtr-api-types';
import { D1Store } from '../inventory/store-types';
import { Vendor } from '../destiny1/vendors/vendor.service';
import { getWeaponList } from './itemListBuilder';
import { updateRatings } from '../item-review/actions';
import { DtrRating } from '../item-review/dtr-api-types';
import { roundToAtMostOneDecimal } from './d2-bulkFetcher';
import { RootState, ThunkResult } from 'app/store/types';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { ratingsSelector, loadReviewsFromIndexedDB } from '../item-review/reducer';

function getBulkFetchPromise(
  stores: (D1Store | Vendor)[],
  ratings: {
    [key: string]: DtrRating;
  }
): Promise<D1ItemFetchResponse[]> {
  if (!stores.length) {
    return Promise.resolve<D1ItemFetchResponse[]>([]);
  }

  const weaponList = getWeaponList(stores, ratings);

  if (!weaponList.length) {
    return Promise.resolve<D1ItemFetchResponse[]>([]);
  }

  const promise = dtrFetch(
    'https://reviews-api.destinytracker.net/api/weaponChecker/fetch',
    weaponList
  ).then(handleErrors, handleErrors);

  loadingTracker.addPromise(promise);

  return promise;
}

/**
 * Fetch the DTR community scores for all weapon items found in the supplied stores.
 */
export function bulkFetch(stores: D1Store[]): ThunkResult<DtrRating[]> {
  return async (dispatch, getState) => {
    if (!getState().reviews.loadedFromIDB) {
      await dispatch(loadReviewsFromIndexedDB());
    }
    const bulkRankings = await getBulkFetchPromise(stores, ratingsSelector(getState()));
    return attachRankings(bulkRankings, dispatch);
  };
}

/**
 * Fetch the DTR community scores for all weapon items found in the supplied vendors.
 */
export function bulkFetchVendorItems(vendorContainer: {
  [key: number]: Vendor;
}): ThunkResult<DtrRating[]> {
  return async (dispatch, getState) => {
    const vendors = Object.values(vendorContainer);

    const bulkRankings = await getBulkFetchPromise(vendors, ratingsSelector(getState()));
    return attachRankings(bulkRankings, dispatch);
  };
}

/**
 * Add (and track) the community score.
 */
function makeRating(dtrRating: D1ItemFetchResponse): DtrRating {
  if (dtrRating?.rating) {
    // not sure if we were sometimes receiving empty ratings or what
    dtrRating.rating = roundToAtMostOneDecimal(dtrRating.rating);
  }

  return {
    referenceId: parseInt(dtrRating.referenceId, 10),
    lastUpdated: new Date(),
    overallScore: dtrRating.rating || 0,
    ratingCount: dtrRating.ratingCount,
    highlightedRatingCount: dtrRating.highlightedRatingCount,
    roll: dtrRating.roll,
  };
}

function attachRankings(
  bulkRankings: D1ItemFetchResponse[] | undefined,
  dispatch: ThunkDispatch<RootState, {}, AnyAction>
) {
  if (bulkRankings?.length) {
    const ratings = bulkRankings.map(makeRating);

    dispatch(updateRatings({ ratings }));

    return ratings;
  }

  return [];
}
