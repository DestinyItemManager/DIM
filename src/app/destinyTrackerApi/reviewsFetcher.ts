import { ratePerks } from './perkRater';
import { ReviewDataCache } from './reviewDataCache';
import { handleErrors } from './trackerErrorHandler';
import { loadingTracker } from '../shell/loading-tracker';
import { D1Item } from '../inventory/item-types';
import { dtrFetch } from './dtr-service-helper';
import { D1ItemReviewResponse, D1ItemUserReview } from '../item-review/d1-dtr-api-types';
import { DtrReviewer } from '../item-review/dtr-api-types';
import { getRollAndPerks } from './itemTransformer';
import { conditionallyIgnoreReviews } from './userFilter';

/** A single user's review for a D1 weapon. */
interface ActualD1ItemUserReview {
  /**
   * Is this reviewer a featured reviewer?
   * Broken in D2.
   */
  isHighlighted: boolean;
  /**
   * Was this review written by the DIM user that requested the reviews?
   * Broken in D2.
   */
  isReviewer: boolean;
  /**
   * Pros.
   * Shouldn't be present (yet).
   */
  pros: string;
  /**
   * Cons.
   * shouldn't be present (yet).
   */
  cons: string;
  /** The DTR review ID. */
  reviewId: string;
  /** Who reviewed it? */
  reviewer: DtrReviewer;
  /** Timestamp associated with the review. */
  timestamp: string;
  /** What perks did the user have selected when they made the review? */
  selectedPerks?: string;
  /** What rating did they give it (1-5)? */
  rating: number;
  /** Text (optionally) associated with the review. */
  review: string;
  /** The roll that the user had on their weapon. */
  roll: string | null;
}

/**
 * The DTR item reviews response.
 * For our purposes, we mostly care that it's a collection of user reviews.
 */
interface ActualD1ItemReviewResponse {
  /** Reference ID for the weapon. */
  referenceId: string;
  /**
   * The roll (available perks).
   * Note that we only send random perks, so exotics, some raid weapons and other weapons don't pass this.
   */
  roll: string | null;
  /** The rating from DTR. We use this. */
  rating?: number;
  /** The number of ratings that DTR has for the weapon (roll). */
  ratingCount: number;
  /** The number of highlighted ratings that DTR has for the weapon (roll). */
  highlightedRatingCount: number;
  reviews: ActualD1ItemUserReview[];
}

/**
 * Get the community reviews from the DTR API for a specific item.
 * This was tailored to work for weapons.  Items (armor, etc.) may or may not work.
 */
export class ReviewsFetcher {
  _reviewDataCache: ReviewDataCache;
  constructor(reviewDataCache: ReviewDataCache) {
    this._reviewDataCache = reviewDataCache;
  }

  _getItemReviewsCall(item) {
    return {
      method: 'POST',
      url: 'https://reviews-api.destinytracker.net/api/weaponChecker/reviews',
      data: item,
      dataType: 'json'
    };
  }

  _getItemReviewsPromise(item: D1Item): Promise<ActualD1ItemReviewResponse> {
    const postWeapon = getRollAndPerks(item);

    const promise = dtrFetch(
      'https://reviews-api.destinytracker.net/api/weaponChecker/reviews',
      postWeapon
    ).then(handleErrors, handleErrors);

    loadingTracker.addPromise(promise);

    return promise;
  }

  _sortAndIgnoreReviews(reviewData: D1ItemReviewResponse) {
    if (reviewData.reviews) {
      reviewData.reviews.sort(this._sortReviews);

      conditionallyIgnoreReviews(reviewData.reviews);
    }
  }

  _attachReviews(item: D1Item, reviewData: D1ItemReviewResponse) {
    reviewData.reviews = reviewData.reviews.filter((review) => review.review); // only attach reviews with text associated

    this._sortAndIgnoreReviews(reviewData);

    this._reviewDataCache.addReviewsData(item, reviewData);

    ratePerks(item);
  }

  _sortReviews(a: D1ItemUserReview, b: D1ItemUserReview) {
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

  /**
   * The D1 API returns an almost-ISO 8601 UTC datetime. This gets us over the hump.
   * http://jasonwatmore.com/post/2016/03/31/angularjs-utc-to-local-date-time-filter
   */
  _toUtcTime(utcDateString: string): Date {
    // right meow unless they tell us otherwise
    if (!utcDateString) {
      return new Date();
    }

    // append 'Z' to the date string to indicate UTC time if the timezone isn't already specified
    if (utcDateString.indexOf('Z') === -1 && utcDateString.indexOf('+') === -1) {
      utcDateString += 'Z';
    }

    return new Date(utcDateString);
  }

  _translateReview(actualReview: ActualD1ItemUserReview): D1ItemUserReview {
    const timestamp = this._toUtcTime(actualReview.timestamp);

    return { ...actualReview, timestamp, id: actualReview.reviewId };
  }

  /**
   * tl;dr - actual responses from the D1 API are UTC strings, but they don't specify the TZ.
   * We'll slap a time zone on to each of the nested reviews from the actual response and return
   * an item review response that we can use without fuss elsewhere.
   */
  _translateReviewResponse(actualResponse: ActualD1ItemReviewResponse): D1ItemReviewResponse {
    const reviews = actualResponse.reviews.map((review) => this._translateReview(review));

    return { ...actualResponse, reviews };
  }

  /**
   * Get community (which may include the current user's) reviews for a given item and attach
   * them to the item.
   * Attempts to fetch data from the cache first.
   */
  async getItemReviews(item: D1Item) {
    if (!item.reviewable) {
      return;
    }
    const cachedData = this._reviewDataCache.getRatingData(item);

    if (cachedData && cachedData.reviewsResponse) {
      return;
    }

    return this._getItemReviewsPromise(item)
      .then((data) => this._translateReviewResponse(data))
      .then((translatedData) => this._attachReviews(item, translatedData));
  }
}
