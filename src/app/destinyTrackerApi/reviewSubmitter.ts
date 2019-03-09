import { ReviewDataCache } from './reviewDataCache';
import { handleSubmitErrors } from './trackerErrorHandler';
import { loadingTracker } from '../shell/loading-tracker';
import { D1Item } from '../inventory/item-types';
import { dtrFetch } from './dtr-service-helper';
import { WorkingD1Rating, D1ItemReviewRequest } from '../item-review/d1-dtr-api-types';
import { DtrReviewer } from '../item-review/dtr-api-types';
import { getRollAndPerks, translateToDtrWeapon } from './itemTransformer';
import { getItemStoreKey } from '../item-review/reducer';
import store from '../store/store';
import { markReviewSubmitted, purgeCachedReview } from '../item-review/actions';

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

  /**
   * There's a 10 minute delay between posting an item review to the DTR API
   * and being able to fetch that review from it.
   * To prevent angry bug reports, we'll continue to hang on to local user review data for
   * 10 minutes, then we'll purge it (so that it can be re-pulled).
   *
   * Item is just an item from DIM's stores.
   */
  eventuallyPurgeCachedData(item: D1Item) {
    const tenMinutes = 1000 * 60 * 10;

    // TODO: This stuff can be untangled
    const dtrItem = translateToDtrWeapon(item);
    const key = getItemStoreKey(dtrItem.referenceId, dtrItem.roll);

    setTimeout(() => store.dispatch(purgeCachedReview({ key })), tenMinutes);
  }

  async submitReview(item, membershipInfo) {
    return this._submitReviewPromise(item, membershipInfo).then(() => {
      this.markItemAsReviewedAndSubmitted(item);
      this.eventuallyPurgeCachedData(item);
    });
  }

  markItemAsReviewedAndSubmitted(item: D1Item) {
    // TODO: This stuff can be untangled
    const dtrItem = translateToDtrWeapon(item);
    const key = getItemStoreKey(dtrItem.referenceId, dtrItem.roll);

    store.dispatch(
      markReviewSubmitted({
        key
      })
    );
  }
}
