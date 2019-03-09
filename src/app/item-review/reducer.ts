import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { D2RatingData, WorkingD2Rating, D2ItemReviewResponse } from './d2-dtr-api-types';
import { D1RatingData, WorkingD1Rating, D1ItemReviewResponse } from './d1-dtr-api-types';
import { DimItem } from '../inventory/item-types';
import { getReviewKey, getD2Roll } from '../destinyTrackerApi/d2-itemTransformer';
import { RootState } from '../store/reducers';

/** Each of the states here is keyed by an "item store key" - see getItemStoreKey */
export interface ReviewsState {
  /** Summary rating data for items (votes/values) */
  ratings: { [key: string]: D2RatingData | D1RatingData };
  /** In-progress user reviews for items. Eventually cleared when they get submitted to DTR. */
  userReviews: { [key: string]: WorkingD2Rating | WorkingD1Rating };
  /** Detailed reviews for items. */
  reviews: { [key: string]: D2ItemReviewResponse | D1ItemReviewResponse };
}

export type ReviewsAction = ActionType<typeof actions>;

const initialState: ReviewsState = {
  ratings: {},
  userReviews: {},
  reviews: {}
};

export const ratingsSelector = (state: RootState) => state.reviews.ratings;

export const reviews: Reducer<ReviewsState, ReviewsAction> = (
  state: ReviewsState = initialState,
  action: ReviewsAction
) => {
  switch (action.type) {
    case getType(actions.updateRatings):
      return {
        ...state,
        ratings: action.payload.itemStores
      };

    case getType(actions.clearRatings):
      return {
        ...initialState
      };

    case getType(actions.reviewsLoaded):
      return {
        ...state,
        reviews: {
          ...state.reviews,
          [action.payload.key]: action.payload.reviews
        }
      };

    case getType(actions.userReview):
      return {
        ...state,
        userReviews: {
          ...state.userReviews,
          [action.payload.key]: action.payload.review
        }
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

  const itemKey = getItemStoreKey(item.hash, roll);
  return ratings[itemKey] && ratings[itemKey];
}

export function shouldShowRating(dtrRating: D2RatingData | D1RatingData | undefined) {
  return (
    dtrRating &&
    dtrRating.overallScore !== undefined &&
    (dtrRating.ratingCount > 2 || dtrRating.highlightedRatingCount > 0)
  );
}
