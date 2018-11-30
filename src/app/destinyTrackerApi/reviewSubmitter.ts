import { ReviewDataCache } from './reviewDataCache';
import { handleSubmitErrors } from './trackerErrorHandler';
import { loadingTracker } from '../shell/loading-tracker';
import { D1Item } from '../inventory/item-types';
import { dtrFetch } from './dtr-service-helper';
import { WorkingD1Rating, D1ItemReviewRequest } from '../item-review/d1-dtr-api-types';
import { DtrReviewer } from '../item-review/dtr-api-types';
import { getRollAndPerks } from './itemTransformer';

export interface D1RatingAndReviewRequest extends D1ItemReviewRequest {
  reviewer?: DtrReviewer;
  rating: number;
  text: string;
  pros: string;
  cons: string;
}

/**
 * Supports submitting review data to the DTR API.
 */
export class ReviewSubmitter {
  _reviewDataCache: ReviewDataCache;
  constructor(reviewDataCache: ReviewDataCache) {
    this._reviewDataCache = reviewDataCache;
  }

  _getReviewer(membershipInfo) {
    return {
      membershipId: membershipInfo.membershipId,
      membershipType: membershipInfo.platformType,
      displayName: membershipInfo.displayName
    };
  }

  toRatingAndReview(item: WorkingD1Rating) {
    return {
      rating: item.rating,
      review: item.review,
      pros: item.pros,
      cons: item.cons
    };
  }

  _submitItemReviewCall(itemReview) {
    return {
      method: 'POST',
      url: 'https://reviews-api.destinytracker.net/api/weaponChecker/reviews/submit',
      data: itemReview,
      dataType: 'json'
    };
  }

  _submitReviewPromise(item: D1Item, membershipInfo: DtrReviewer) {
    if (!item.dtrRating || !item.dtrRating.userReview) {
      return Promise.resolve({});
    }

    const rollAndPerks = getRollAndPerks(item);
    const reviewer = this._getReviewer(membershipInfo);
    const review = this.toRatingAndReview(item.dtrRating.userReview);

    const rating = { ...rollAndPerks, ...review, reviewer };

    const promise = dtrFetch(
      'https://reviews-api.destinytracker.net/api/weaponChecker/reviews/submit',
      rating
    ).then(handleSubmitErrors, handleSubmitErrors);

    loadingTracker.addPromise(promise);

    return promise;
  }

  // Submitted data takes a while to wend its way into live reviews.  In the interim, don't lose track of what we sent.
  _eventuallyPurgeCachedData(item) {
    this._reviewDataCache.eventuallyPurgeCachedData(item);
  }

  _markItemAsReviewedAndSubmitted(item: D1Item) {
    this._reviewDataCache.markItemAsReviewedAndSubmitted(item);
  }

  async submitReview(item, membershipInfo) {
    return this._submitReviewPromise(item, membershipInfo).then(() => {
      this._markItemAsReviewedAndSubmitted(item);
      this._eventuallyPurgeCachedData(item);
    });
  }
}
