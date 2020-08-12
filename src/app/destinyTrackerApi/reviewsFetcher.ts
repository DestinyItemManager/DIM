import { handleErrors } from './trackerErrorHandler';
import { loadingTracker } from '../shell/loading-tracker';
import { D1Item } from '../inventory/item-types';
import { dtrFetch } from './dtr-service-helper';
import {
  D1ItemReviewResponse,
  D1ItemUserReview,
  ActualD1ItemReviewResponse,
  ActualD1ItemUserReview,
} from '../item-review/d1-dtr-api-types';
import { getRollAndPerks } from './itemTransformer';
import { conditionallyIgnoreReviews } from './userFilter';
import { toUtcTime } from './util';
import { getReviews, getItemReviewsKey } from '../item-review/reducer';
import { reviewsLoaded } from '../item-review/actions';
import { ThunkResult } from 'app/store/types';

/**
 * Redux action that populates community (which may include the current user's) reviews for a given item.
 */
export function getItemReviewsD1(item: D1Item): ThunkResult<D1ItemReviewResponse | undefined> {
  return async (dispatch, getState) => {
    if (!item.reviewable) {
      return undefined;
    }

    const existingReviews = getReviews(item, getState());

    // TODO: it'd be cool to mark these as "loading"
    if (existingReviews) {
      return existingReviews as D1ItemReviewResponse;
    }

    const data = await getItemReviewsPromise(item);
    const reviewData = translateReviewResponse(data);

    reviewData.reviews = reviewData.reviews.filter((review) => review.review); // only attach reviews with text associated

    sortAndIgnoreReviews(reviewData);

    dispatch(
      reviewsLoaded({
        key: getItemReviewsKey(item),
        reviews: reviewData,
      })
    );

    return reviewData;
  };
}

function getItemReviewsPromise(item: D1Item): Promise<ActualD1ItemReviewResponse> {
  const postWeapon = getRollAndPerks(item);

  const promise = dtrFetch(
    'https://reviews-api.destinytracker.net/api/weaponChecker/reviews',
    postWeapon
  ).then(handleErrors, handleErrors);

  loadingTracker.addPromise(promise);

  return promise;
}

function sortAndIgnoreReviews(reviewData: D1ItemReviewResponse) {
  if (reviewData.reviews) {
    reviewData.reviews.sort(sortReviews);

    conditionallyIgnoreReviews(reviewData.reviews);
  }
}

function sortReviews(a: D1ItemUserReview, b: D1ItemUserReview) {
  if (a.isReviewer) {
    return -1;
  }

  if (b.isReviewer) {
    return 1;
  }

  if (a.isHighlighted) {
    return -1;
  }

  if (b.isHighlighted) {
    return 1;
  }

  const ratingDiff = b.rating - a.rating;

  if (ratingDiff !== 0) {
    return ratingDiff;
  }

  const aDate = new Date(a.timestamp).getTime();
  const bDate = new Date(b.timestamp).getTime();

  return bDate - aDate;
}

function translateReview(actualReview: ActualD1ItemUserReview): D1ItemUserReview {
  const timestamp = toUtcTime(actualReview.timestamp);

  return { ...actualReview, timestamp, id: actualReview.reviewId };
}

/**
 * tl;dr - actual responses from the D1 API are UTC strings, but they don't specify the TZ.
 * We'll slap a time zone on to each of the nested reviews from the actual response and return
 * an item review response that we can use without fuss elsewhere.
 */
function translateReviewResponse(actualResponse: ActualD1ItemReviewResponse): D1ItemReviewResponse {
  const reviews = actualResponse.reviews.map(translateReview);

  return { ...actualResponse, reviews, lastUpdated: new Date() };
}
