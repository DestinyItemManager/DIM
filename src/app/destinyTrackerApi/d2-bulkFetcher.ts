import {
  DestinyVendorSaleItemComponent,
  DestinyVendorItemDefinition,
} from 'bungie-api-ts/destiny2';
import { loadingTracker } from '../shell/loading-tracker';
import { handleD2Errors } from './d2-trackerErrorHandler';
import { D2Store } from '../inventory/store-types';
import { dtrFetch, dtrTextReviewMultiplier, dtrD2ReviewsEndpoint } from './dtr-service-helper';
import { D2ItemFetchResponse, D2ItemFetchRequest } from '../item-review/d2-dtr-api-types';
import { getVendorItemList, getItemList } from './d2-itemListBuilder';
import _ from 'lodash';
import { updateRatings } from '../item-review/actions';
import { DtrRating } from '../item-review/dtr-api-types';
import { getD2Roll } from './d2-itemTransformer';
import { RootState, ThunkResult } from 'app/store/types';
import { ratingsSelector, loadReviewsFromIndexedDB } from '../item-review/reducer';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { DtrD2ActivityModes, DtrReviewPlatform } from '@destinyitemmanager/dim-api-types';

function getBulkFetchPromise(
  ratings: {
    [key: string]: DtrRating;
  },
  stores: D2Store[],
  platformSelection: DtrReviewPlatform,
  mode: DtrD2ActivityModes
): Promise<D2ItemFetchResponse[]> {
  if (!stores.length) {
    return Promise.resolve<D2ItemFetchResponse[]>([]);
  }

  const itemList = getItemList(stores, ratings);
  return getBulkItems(itemList, platformSelection, mode);
}

function getVendorBulkFetchPromise(
  ratings: {
    [key: string]: DtrRating;
  },
  platformSelection: DtrReviewPlatform,
  mode: DtrD2ActivityModes,
  vendorSaleItems?: DestinyVendorSaleItemComponent[],
  vendorItems?: DestinyVendorItemDefinition[]
): Promise<D2ItemFetchResponse[]> {
  if (vendorSaleItems?.length || (vendorItems && !vendorItems.length)) {
    return Promise.resolve<D2ItemFetchResponse[]>([]);
  }

  const vendorDtrItems = getVendorItemList(ratings, vendorSaleItems, vendorItems);
  return getBulkItems(vendorDtrItems, platformSelection, mode);
}

export async function getBulkItems(
  itemList: D2ItemFetchRequest[],
  platformSelection: DtrReviewPlatform,
  mode: DtrD2ActivityModes
): Promise<D2ItemFetchResponse[]> {
  if (!itemList.length) {
    return Promise.resolve<D2ItemFetchResponse[]>([]);
  }

  // DTR admins requested we only make requests in batches of 150, and not in parallel
  const arrayOfArrays: D2ItemFetchRequest[][] = _.chunk(itemList, 150);

  const results: D2ItemFetchResponse[] = [];

  for (const arraySlice of arrayOfArrays) {
    const promiseSlice = dtrFetch(
      `${dtrD2ReviewsEndpoint}/fetch?platform=${platformSelection}&mode=${mode}`,
      arraySlice
    ).then(handleD2Errors, handleD2Errors);

    try {
      loadingTracker.addPromise(promiseSlice);
      const result = (await promiseSlice) as D2ItemFetchResponse[];
      if (!result) {
        throw new Error('No result from DTR');
      }

      // DTR returns nothing for items with no ratings - fill in empties
      for (const item of arraySlice) {
        // This should compare perks too but the returned perks don't always match
        if (!result.some((r) => r.referenceId === item.referenceId)) {
          result.push({
            referenceId: item.referenceId,
            availablePerks: item.availablePerks,
            votes: { referenceId: item.referenceId, upvotes: 0, downvotes: 0, total: 0, score: 0 },
            reviewVotes: {
              referenceId: item.referenceId,
              upvotes: 0,
              downvotes: 0,
              total: 0,
              score: 0,
            },
          });
        }
      }
      results.push(...result);
    } catch (e) {
      console.error(e);
    }
  }

  return results;
}

/**
 * Fetch the DTR community scores for all weapon items found in the supplied stores.
 */
export function bulkFetch(
  stores: D2Store[],
  platformSelection: DtrReviewPlatform,
  mode: DtrD2ActivityModes
): ThunkResult<DtrRating[]> {
  return async (dispatch, getState) => {
    if (!getState().reviews.loadedFromIDB) {
      await dispatch(loadReviewsFromIndexedDB());
    }

    const existingRatings = ratingsSelector(getState());
    const bulkRankings = await getBulkFetchPromise(
      existingRatings,
      stores,
      platformSelection,
      mode
    );
    return addScores(bulkRankings, dispatch);
  };
}

/**
 * Fetch the DTR community scores for all weapon items found in the supplied vendors.
 */
export function bulkFetchVendorItems(
  platformSelection: number,
  mode: DtrD2ActivityModes,
  vendorSaleItems?: DestinyVendorSaleItemComponent[],
  vendorItems?: DestinyVendorItemDefinition[]
): ThunkResult<DtrRating[]> {
  return async (dispatch, getState) => {
    const existingRatings = ratingsSelector(getState());
    const bulkRankings = await getVendorBulkFetchPromise(
      existingRatings,
      platformSelection,
      mode,
      vendorSaleItems,
      vendorItems
    );
    return addScores(bulkRankings, dispatch);
  };
}

/**
 * Add (and track) the community scores.
 */
export function addScores(
  bulkRankings: D2ItemFetchResponse[],
  dispatch: ThunkDispatch<RootState, {}, AnyAction>
) {
  if (bulkRankings?.length) {
    const ratings = bulkRankings.map(makeRating);

    dispatch(updateRatings({ ratings }));

    return ratings;
  }

  return [];
}

export function roundToAtMostOneDecimal(rating: number): number {
  if (!rating) {
    return 0;
  }

  return Math.round(rating * 10) / 10;
}

function getDownvoteMultiplier(dtrRating: D2ItemFetchResponse) {
  if (dtrRating.votes.total > 100) {
    return 1;
  }

  if (dtrRating.votes.total > 50) {
    return 1.5;
  }

  if (dtrRating.votes.total > 25) {
    return 2;
  }

  return 2.5;
}

function getScore(dtrRating: D2ItemFetchResponse): number {
  const downvoteMultipler = getDownvoteMultiplier(dtrRating);

  const totalVotes = dtrRating.votes.total + dtrRating.reviewVotes.total * dtrTextReviewMultiplier;
  const totalDownVotes =
    dtrRating.votes.downvotes + dtrRating.reviewVotes.downvotes * dtrTextReviewMultiplier;

  const rating = ((totalVotes - totalDownVotes * downvoteMultipler) / totalVotes) * 5;

  if (rating < 1 && dtrRating.votes.total > 0) {
    return 1;
  }

  return roundToAtMostOneDecimal(rating);
}

function makeRating(dtrRating: D2ItemFetchResponse): DtrRating {
  return {
    referenceId: dtrRating.referenceId,
    roll: getD2Roll(dtrRating.availablePerks),
    overallScore: getScore(dtrRating),
    lastUpdated: new Date(),
    ratingCount: dtrRating.votes.total,
    votes: dtrRating.votes,
    reviewVotes: dtrRating.reviewVotes,
    highlightedRatingCount: 0, // bugbug: D2 API doesn't seem to be returning highlighted ratings in fetch
  };
}
