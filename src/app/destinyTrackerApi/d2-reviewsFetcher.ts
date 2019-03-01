import * as _ from 'lodash';
import { getActivePlatform } from '../accounts/platform.service';
import { D2ReviewDataCache } from './d2-reviewDataCache';
import { loadingTracker } from '../shell/loading-tracker';
import { handleD2Errors } from './d2-trackerErrorHandler';
import { D2Item } from '../inventory/item-types';
import { dtrFetch } from './dtr-service-helper';
import {
  D2ItemReviewResponse,
  D2ItemUserReview,
  DtrD2Vote,
  DtrD2ActivityModes
} from '../item-review/d2-dtr-api-types';
import { getRollAndPerks } from './d2-itemTransformer';
import { ratePerks } from './d2-perkRater';
import { conditionallyIgnoreReviews } from './userFilter';
import { toUtcTime } from './util';
import { DtrReviewer } from '../item-review/dtr-api-types';

interface ActualD2ItemUserReview {
  /** The DTR review ID. */
  id: string;
  /**
   * This is not returned from DTR, it's calculated on our end.
   * Will be set on reviews associated with any other reviwer that the user reports.
   */
  isIgnored?: boolean;
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
  /** The instance ID for the item reviewed. */
  instanceId?: string;
  /** What was their vote? Should be -1 or 1. */
  voted: number;
  /**
   * Review text.
   * Optional to send, optional to receive.
   */
  text?: string;
  /** What perks did the user have selected on this item? */
  selectedPerks: number[];
  /** If it's a random roll, what's the complete list of (random) perks on it? */
  availablePerks?: number[];
  /** What power mods did the user have attached to this item? */
  attachedMods: number[];
  /** What play mode is this for? */
  mode: DtrD2ActivityModes;
  /**
   * Sandbox season (1 was the first, 2 is the March 2018 "go fast" update).
   * Not enumerating these values here because we're not using this and who wants to update this with a new sandbox?
   */
  sandbox: number;
  timestamp: string;
  /** Who reviewed it? */
  reviewer: DtrReviewer;
}

interface ActualD2ItemReviewResponse {
  /** Reference ID (hash ID). */
  referenceId: number;
  /** The votes for a single item. */
  votes: DtrD2Vote;
  /** The total number of reviews. */
  totalReviews: number;
  /**
   * Reviews for the item.
   * More particulars - they return a maximum of 25 text reviews per item, newest first, and we can page through them.
   * Don't tell anyone I haven't bothered building pagination out yet.
   */
  reviews: ActualD2ItemUserReview[];
}

/**
 * Get the community reviews from the DTR API for a specific item.
 */
class D2ReviewsFetcher {
  _reviewDataCache: D2ReviewDataCache;

  constructor(reviewDataCache) {
    this._reviewDataCache = reviewDataCache;
  }

  _getItemReviewsPromise(
    item,
    platformSelection: number,
    mode: number
  ): Promise<ActualD2ItemReviewResponse> {
    const dtrItem = getRollAndPerks(item);

    const queryString = `page=1&platform=${platformSelection}&mode=${mode}`;
    const promise = dtrFetch(
      `https://db-api.destinytracker.com/api/external/reviews?${queryString}`, // TODO: pagination
      dtrItem
    ).then(handleD2Errors, handleD2Errors);

    loadingTracker.addPromise(promise);

    return promise;
  }

  _getUserReview(reviewData: D2ItemReviewResponse) {
    // bugbug: will need to use membership service if isReviewer flag stays broke
    return reviewData.reviews.find((r) => r.isReviewer);
  }

  _sortAndIgnoreReviews(reviewResponse: D2ItemReviewResponse) {
    if (reviewResponse.reviews) {
      reviewResponse.reviews.sort(this._sortReviews);

      conditionallyIgnoreReviews(reviewResponse.reviews);
    }
  }

  _markUserReview(reviewData: D2ItemReviewResponse) {
    const membershipInfo = getActivePlatform();

    if (!membershipInfo) {
      return;
    }

    const membershipId = membershipInfo.membershipId;

    _.each(reviewData.reviews, (review) => {
      if (review.reviewer.membershipId === membershipId) {
        review.isReviewer = true;
      }
    });

    return reviewData;
  }

  _attachReviews(item: D2Item, reviewData: D2ItemReviewResponse) {
    this._sortAndIgnoreReviews(reviewData);

    this._reviewDataCache.addReviewsData(item, reviewData);
    const dtrRating = this._reviewDataCache.getRatingData(item);

    ratePerks(item, dtrRating);
  }

  _sortReviews(a: D2ItemUserReview, b: D2ItemUserReview) {
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

    const ratingDiff = b.voted - a.voted;

    if (ratingDiff !== 0) {
      return ratingDiff;
    }

    const aDate = new Date(a.timestamp).getTime();
    const bDate = new Date(b.timestamp).getTime();

    return bDate - aDate;
  }

  _translateReview(returnedUserReview: ActualD2ItemUserReview): D2ItemUserReview {
    const timestamp = toUtcTime(returnedUserReview.timestamp);

    return {
      ...returnedUserReview,
      timestamp
    };
  }

  _translateReviewResponse(actualResponse: ActualD2ItemReviewResponse): D2ItemReviewResponse {
    const reviews = actualResponse.reviews.map((review) => this._translateReview(review));

    return { ...actualResponse, reviews };
  }

  /**
   * Get community (which may include the current user's) reviews for a given item and attach
   * them to the item.
   * Attempts to fetch data from the cache first.
   */
  async getItemReviews(item: D2Item, platformSelection: number, mode: number) {
    if (!item.reviewable) {
      return;
    }

    const cachedData = this._reviewDataCache.getRatingData(item);

    if (cachedData && cachedData.reviewsResponse) {
      ratePerks(item, cachedData);
      return;
    }

    return this._getItemReviewsPromise(item, platformSelection, mode)
      .then((returnedReviewsData) => this._translateReviewResponse(returnedReviewsData))
      .then((returnedReviewData) => {
        const reviewData = { ...returnedReviewData };
        this._markUserReview(reviewData);
        this._attachReviews(item, reviewData);
      });
  }

  fetchItemReviews(
    itemHash: number,
    platformSelection: number,
    mode: number
  ): Promise<D2ItemReviewResponse> {
    const cachedData = this._reviewDataCache.getRatingData(undefined, itemHash);

    if (cachedData && cachedData.reviewsResponse) {
      return Promise.resolve(cachedData.reviewsResponse);
    }

    const fakeItem = { hash: itemHash, id: -1 };

    return this._getItemReviewsPromise(fakeItem, platformSelection, mode).then(
      (returnedReviewsData) => this._translateReviewResponse(returnedReviewsData)
    );
  }
}

export { D2ReviewsFetcher };
