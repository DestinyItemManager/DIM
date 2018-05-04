import { D2ItemTransformer } from './d2-itemTransformer';
import { D2ReviewDataCache } from './d2-reviewDataCache';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { loadingTracker } from '../ngimport-more';
import { handleD2SubmitErrors, DtrSubmitResponse } from './d2-trackerErrorHandler';
import { D2Item } from '../inventory/item-types';
import { dtrFetch } from './dtr-service-helper';
import { WorkingD2Rating } from '../item-review/d2-dtr-api-types';
import { DtrReviewer } from '../item-review/dtr-api-types';
import { $q } from 'ngimport';

export interface D2RatingAndReviewRequest {
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
  _itemTransformer = new D2ItemTransformer();
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

  toRatingAndReview(dimUserReview: WorkingD2Rating): D2RatingAndReviewRequest {
    return {
      voted: dimUserReview.voted,
      text: dimUserReview.text,
      pros: dimUserReview.pros,
      cons: dimUserReview.cons,
      mode: dimUserReview.mode
    };
  }

  _submitReviewPromise(item: D2Item, membershipInfo: DestinyAccount | null) {
    if (!item.ratingData ||
        !item.ratingData.userReview) {
      return Promise.resolve<DtrSubmitResponse>({});
    }

    const rollAndPerks = this._itemTransformer.getRollAndPerks(item);
    const reviewer = this._getReviewer(membershipInfo);

    const review = this.toRatingAndReview(item.ratingData.userReview);

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

  _markItemAsReviewedAndSubmitted(item: D2Item) {
    if (!item.ratingData ||
        !item.ratingData.userReview) {
      return;
    }

    this._reviewDataCache.markItemAsReviewedAndSubmitted(item);
  }

  submitReview(item: D2Item, membershipInfo: DestinyAccount | null) {
    if (!item.ratingData ||
        !item.ratingData.userReview) {
      return $q.resolve();
    }

    this._submitReviewPromise(item, membershipInfo)
      .then(() => {
        this._markItemAsReviewedAndSubmitted(item);
        this._eventuallyPurgeCachedData(item);
      });
  }
}

export { D2ReviewSubmitter };
