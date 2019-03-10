import { handleErrors } from './trackerErrorHandler';
import { loadingTracker } from '../shell/loading-tracker';
import { dtrFetch } from './dtr-service-helper';
import { D1ItemFetchResponse } from '../item-review/d1-dtr-api-types';
import { D1Store } from '../inventory/store-types';
import { Vendor } from '../vendors/vendor.service';
import { getWeaponList } from './itemListBuilder';
import store from '../store/store';
import { updateRatings } from '../item-review/actions';
import { DtrRating } from '../item-review/dtr-api-types';
import { roundToAtMostOneDecimal } from './d2-bulkFetcher';

function getBulkFetchPromise(stores: (D1Store | Vendor)[]): Promise<D1ItemFetchResponse[]> {
  if (!stores.length) {
    return Promise.resolve<D1ItemFetchResponse[]>([]);
  }

  const weaponList = getWeaponList(stores);

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
export function bulkFetch(stores: D1Store[]) {
  getBulkFetchPromise(stores).then(attachRankings);
}

/**
 * Fetch the DTR community scores for all weapon items found in the supplied vendors.
 */
export function bulkFetchVendorItems(vendorContainer: { [key: number]: Vendor }) {
  const vendors = Object.values(vendorContainer);

  return getBulkFetchPromise(vendors).then(attachRankings);
}

/**
 * Add (and track) the community score.
 */
function makeRating(dtrRating: D1ItemFetchResponse): DtrRating {
  if (dtrRating && dtrRating.rating) {
    // not sure if we were sometimes receiving empty ratings or what
    dtrRating.rating = roundToAtMostOneDecimal(dtrRating.rating);
  }

  return {
    referenceId: parseInt(dtrRating.referenceId, 10),
    lastUpdated: new Date(),
    overallScore: dtrRating.rating || 0,
    ratingCount: dtrRating.ratingCount,
    highlightedRatingCount: dtrRating.highlightedRatingCount,
    roll: dtrRating.roll
  };
}

function attachRankings(bulkRankings?: D1ItemFetchResponse[]) {
  if (!bulkRankings) {
    return;
  }

  if (bulkRankings && bulkRankings.length > 0) {
    const ratings = bulkRankings.map(makeRating);

    store.dispatch(updateRatings({ ratings }));
  }
}
