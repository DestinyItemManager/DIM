import { D2ReviewDataCache } from './d2-reviewDataCache';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { loadingTracker } from '../ngimport-more';
import { handleD2SubmitErrors } from './d2-trackerErrorHandler';
import { D2Item } from '../inventory/item-types';
import { DtrReviewer } from '../item-review/destiny-tracker.service';
import { dtrFetch } from './dtr-service-helper';
import { getRollAndPerks } from './d2-itemTransformer';

export interface RatingAndReviewRequest {
  reviewer?: DtrReviewer;
  voted: number;
  text: string;
  pros: string;
  cons: string;
  mode: number;
  isReviewer?: boolean;
  timestamp?: string;
}

/**
 * Supports submitting D2 review data to the DTR API.
 */
class D2ReviewSubmitter {
  _reviewDataCache: D2ReviewDataCache;
  constructor(reviewDataCache) {
    this._reviewDataCache = reviewDataCache;
  }

  _getReviewer(membershipInfo): DtrReviewer {
    return {
      membershipId: membershipInfo.membershipId,
      membershipType: membershipInfo.platformType,
      displayName: membershipInfo.displayName
    };
  }

  toRatingAndReview(item: D2Item): RatingAndReviewRequest {
    return {
      voted: item.userVote,
      text: item.userReview,
      pros: item.pros,
      cons: item.cons,
      mode: item.mode
    };
  }

  _submitReviewPromise(item: D2Item, membershipInfo: DestinyAccount | null) {
    const rollAndPerks = getRollAndPerks(item);
    const reviewer = this._getReviewer(membershipInfo);
    const review = this.toRatingAndReview(item);

    const rating = { ...rollAndPerks, ...review, reviewer };

    const promise = dtrFetch(
      `https://db-api.destinytracker.com/api/external/reviews/submit`,
      rating
    ).then(handleD2SubmitErrors, handleD2SubmitErrors);

    loadingTracker.addPromise(promise);

    return promise;
  }

  // Submitted data takes a while to wend its way into live reviews.  In the interim, don't lose track of what we sent.
  _eventuallyPurgeCachedData(item: D2Item) {
    this._reviewDataCache.eventuallyPurgeCachedData(item);
  }

  _markItemAsReviewedAndSubmitted(item: D2Item, membershipInfo: DestinyAccount | null) {
    const review = this.toRatingAndReview(item);
    review.isReviewer = true;
    review.reviewer = this._getReviewer(membershipInfo);
    review.timestamp = new Date().toISOString();

    this._reviewDataCache.markItemAsReviewedAndSubmitted(item,
                                                         review);
  }

  submitReview(item: D2Item, membershipInfo: DestinyAccount | null) {
    this._submitReviewPromise(item, membershipInfo)
      .then(() => {
        this._markItemAsReviewedAndSubmitted(item, membershipInfo);
        this._eventuallyPurgeCachedData(item);
      });
  }
}

export { D2ReviewSubmitter };
