import { createStandardAction } from 'typesafe-actions';
import { D2ItemReviewResponse, WorkingD2Rating } from './d2-dtr-api-types';
import { D1ItemReviewResponse, WorkingD1Rating } from './d1-dtr-api-types';
import { DtrRating } from './dtr-api-types';
import { DimItem } from '../inventory/item-types';

/**
 * Reflect the old stores service data into the Redux store as a migration aid.
 */
export const updateRatings = createStandardAction('ratings/UPDATE')<{
  ratings: DtrRating[];
}>();

export const clearRatings = createStandardAction('ratings/CLEAR')();

export const reviewsLoaded = createStandardAction('ratings/REVIEWS_LOADED')<{
  key: string;
  reviews: D2ItemReviewResponse | D1ItemReviewResponse;
}>();

/**
 * Keep track of this user review for this (DIM store) item.
 * This supports the workflow where a user types a review but doesn't submit it, a store refresh
 * happens in the background, then they go back to the item.  Or they post data and the DTR API
 * is still feeding back cached data or processing it or whatever.
 * The expectation is that this will be building on top of reviews data that's already been supplied.
 */
export const saveUserReview = createStandardAction('ratings/USER_REVIEW')<{
  item: DimItem;
  review: WorkingD2Rating | WorkingD1Rating;
}>();

export const markReviewSubmitted = createStandardAction('ratings/REVIEW_SUBMITTED')<{
  key: string;
}>();

export const purgeCachedReview = createStandardAction('ratings/PURGE_REVIEW')<{
  key: string;
}>();

export const markReviewerFlagged = createStandardAction('ratings/FLAG_REVIEWER')<{
  membershipId: string;
}>();

export const loadFromIDB = createStandardAction('ratings/LOAD_FROM_IDB')<{
  /** Summary rating data for items (votes/values) */
  ratings: { [key: string]: DtrRating };
  /** Detailed reviews for items. */
  reviews: { [key: string]: D2ItemReviewResponse | D1ItemReviewResponse };
}>();
