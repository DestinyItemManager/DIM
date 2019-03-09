import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import {
  D2RatingData,
  WorkingD2Rating,
  D2ItemReviewResponse,
  D2ItemUserReview
} from './d2-dtr-api-types';
import {
  D1RatingData,
  WorkingD1Rating,
  D1ItemReviewResponse,
  D1ItemUserReview
} from './d1-dtr-api-types';
import { DimItem } from '../inventory/item-types';
import { getReviewKey, getD2Roll } from '../destinyTrackerApi/d2-itemTransformer';
import { RootState } from '../store/reducers';
import produce from 'immer';

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

    case getType(actions.reviewsLoaded): {
      const key = action.payload.key;
      const reviewsData = action.payload.reviews;
      const userReview = (reviewsData.reviews as (D1ItemUserReview | D2ItemUserReview)[]).find(
        (r) => r.isReviewer
      );
      const existingUserReview = state.userReviews[key];

      return produce(state, (draft) => {
        // Update the working user review from submitted reviews
        if (userReview && !existingUserReview) {
          // TODO: This doesn't seem quite right
          draft.userReviews[key] = (userReview as unknown) as WorkingD2Rating | WorkingD1Rating;
        }
        draft.reviews[key] = reviewsData;
      });
    }

    case getType(actions.userReview):
      return {
        ...state,
        userReviews: {
          ...state.userReviews,
          [action.payload.key]: action.payload.review
        }
      };

    case getType(actions.markReviewSubmitted): {
      const key = action.payload.key;
      return produce(state, (draft) => {
        const userReview = draft.userReviews[key];
        if (userReview) {
          userReview.treatAsSubmitted = true;
        }
        const reviews = draft.reviews[key];
        if (reviews) {
          draft.reviews[key].reviews = (reviews.reviews as (
            | D1ItemUserReview
            | D2ItemUserReview)[]).filter((review) => !review.isReviewer) as (
            | D1ItemUserReview[]
            | D2ItemUserReview[]);
        }
      });
    }

    case getType(actions.purgeCachedReview): {
      const key = action.payload.key;
      return produce(state, (draft) => {
        delete draft.reviews[key];
        delete draft.userReviews[key];
      });
    }

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
  return ratings[itemKey];
}

export function getReviews(
  item: DimItem,
  state: RootState
): D2ItemReviewResponse | D1ItemReviewResponse | undefined {
  let roll: string | null = null;

  if (item.isDestiny1() && item.talentGrid) {
    roll = item.talentGrid.dtrRoll;
  } else if (item.isDestiny2()) {
    const reviewKey = getReviewKey(item);

    roll = getD2Roll(reviewKey.availablePerks);
  }

  const itemKey = getItemStoreKey(item.hash, roll);
  return state.reviews.reviews[itemKey];
}

export function shouldShowRating(dtrRating: D2RatingData | D1RatingData | undefined) {
  return (
    dtrRating &&
    dtrRating.overallScore !== undefined &&
    (dtrRating.ratingCount > 2 || dtrRating.highlightedRatingCount > 0)
  );
}
