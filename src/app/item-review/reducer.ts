import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { D2RatingData } from './d2-dtr-api-types';
import { D1RatingData } from './d1-dtr-api-types';

// TODO: Should this be by account? Accounts need IDs
export interface ReviewsState {
  maxTotalVotes: number;
  ratings: { [key: string]: D2RatingData | D1RatingData };
}

export type ReviewsAction = ActionType<typeof actions>;

export const initialReviewsState: ReviewsState = {
  maxTotalVotes: 0,
  ratings: {}
};

export const reviews: Reducer<ReviewsState, ReviewsAction> = (
  state: ReviewsState = initialReviewsState,
  action: ReviewsAction
) => {
  switch (action.type) {
    case getType(actions.updateRatings):
      return {
        maxTotalVotes: action.payload.maxTotalVotes,
        ratings: ratingsFromItemStores(action.payload.itemStores)
      };
    default:
      return state;
  }
};

function ratingsFromItemStores(itemStores: (D2RatingData | D1RatingData)[]): { [key: string]: D2RatingData | D1RatingData } {
  const ratings: { [key: string]: D2RatingData | D1RatingData } = {};
  for (const itemStore of itemStores) {
    ratings[`${itemStore.referenceId}-${itemStore.roll}`] = itemStore;
  }
  return ratings;
}
