import { createStandardAction } from 'typesafe-actions';
import { D2RatingData, D2ItemReviewResponse, WorkingD2Rating } from './d2-dtr-api-types';
import { D1RatingData, D1ItemReviewResponse, WorkingD1Rating } from './d1-dtr-api-types';

/**
 * Reflect the old stores service data into the Redux store as a migration aid.
 */
export const updateRatings = createStandardAction('ratings/UPDATE')<{
  maxTotalVotes?: number;
  itemStores: { [key: string]: D2RatingData | D1RatingData };
}>();

export const clearRatings = createStandardAction('ratings/CLEAR')();

export const reviewsLoaded = createStandardAction('ratings/REVIEWS_LOADED')<{
  key: string;
  reviews: D2ItemReviewResponse | D1ItemReviewResponse;
}>();

export const userReview = createStandardAction('ratings/USER_REVIEW')<{
  key: string;
  review: WorkingD2Rating | WorkingD1Rating;
}>();
