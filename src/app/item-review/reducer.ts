import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { D2RatingData } from './d2-dtr-api-types';
import { D1RatingData } from './d1-dtr-api-types';
import { DimItem } from '../inventory/item-types';
import { getReviewKey, getD2Roll } from '../destinyTrackerApi/d2-itemTransformer';
import { RootState } from '../store/reducers';

// TODO: Should this be by account? Accounts need IDs
export interface ReviewsState {
  ratings: { [key: string]: D2RatingData | D1RatingData };
}

export type ReviewsAction = ActionType<typeof actions>;

const initialState: ReviewsState = {
  ratings: {}
};

export const ratingsSelector = (state: RootState) => state.reviews.ratings;

export const reviews: Reducer<ReviewsState, ReviewsAction> = (
  state: ReviewsState = initialState,
  action: ReviewsAction
) => {
  switch (action.type) {
    case getType(actions.updateRatings):
      return {
        ratings: action.payload.itemStores
      };

    case getType(actions.clearRatings):
      return {
        ratings: {}
      };
    default:
      return state;
  }
};

// TODO: rename
export function getItemStoreKey(referenceId: number | string, roll: string | null) {
  return `${referenceId}-${roll || 'fixed'}`;
}

export function getRating(
  item: DimItem,
  ratings: ReviewsState['ratings']
): D2RatingData | D1RatingData | undefined {
  let roll: string | null = null;

  if (item.isDestiny1() && item.talentGrid) {
    roll = item.talentGrid.dtrRoll;
  } else if (item.isDestiny2()) {
    const reviewKey = getReviewKey(item);

    roll = getD2Roll(reviewKey.availablePerks);
  }

  const itemKey = `${item.hash}-${roll}`;
  return ratings[itemKey] && ratings[itemKey];
}

export function shouldShowRating(dtrRating: D2RatingData | D1RatingData | undefined) {
  return (
    dtrRating &&
    dtrRating.overallScore !== undefined &&
    (dtrRating.ratingCount > 2 || dtrRating.highlightedRatingCount > 0)
  );
}
