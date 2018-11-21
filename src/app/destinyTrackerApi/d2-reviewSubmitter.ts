import { D2ReviewDataCache } from './d2-reviewDataCache';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { loadingTracker } from '../shell/loading-tracker';
import { handleD2SubmitErrors, DtrSubmitResponse } from './d2-trackerErrorHandler';
import { D2Item } from '../inventory/item-types';
import { dtrFetch } from './dtr-service-helper';
import { WorkingD2Rating } from '../item-review/d2-dtr-api-types';
import { DtrReviewer } from '../item-review/dtr-api-types';
import { getRollAndPerks } from './d2-itemTransformer';

/** Request to add a new rating (and optional review) for an item. */
interface D2ReviewSubmitRequest {
  /** Reference ID (item hash). */
  referenceId: number;
  /** Instance ID (vaguely personally identifying). */
  instanceId?: string;
  /** What mods does the user have attached? */
  attachedMods?: number[];
  /** What perks does the user have selected? */
  selectedPerks?: number[];
  /** If it's a random roll, what's the complete list of (random) perks on it? */
  availablePerks?: number[];

  reviewer: DtrReviewer;
  voted: number;
  text: string;
  pros: string;
  cons: string;
  mode: number;
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

  toRatingAndReview(dimUserReview: WorkingD2Rating) {
    return {
      voted: dimUserReview.voted,
      text: dimUserReview.text,
      pros: dimUserReview.pros,
      cons: dimUserReview.cons,
      mode: dimUserReview.mode
    };
  }

  _submitReviewPromise(item: D2Item, membershipInfo: DestinyAccount | null) {
    if (!item.dtrRating || !item.dtrRating.userReview) {
      return Promise.resolve<DtrSubmitResponse>({});
    }

    const rollAndPerks = getRollAndPerks(item);
    const reviewer = this._getReviewer(membershipInfo);

    const review = this.toRatingAndReview(item.dtrRating.userReview);

    const rating: D2ReviewSubmitRequest = { ...rollAndPerks, ...review, reviewer };

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
    if (!item.dtrRating || !item.dtrRating.userReview) {
      return;
    }

    this._reviewDataCache.markItemAsReviewedAndSubmitted(item);
  }

  async submitReview(item: D2Item, membershipInfo: DestinyAccount | null) {
    if (!item.dtrRating || !item.dtrRating.userReview) {
      return Promise.resolve();
    }

    return this._submitReviewPromise(item, membershipInfo).then(() => {
      this._markItemAsReviewedAndSubmitted(item);
      this._eventuallyPurgeCachedData(item);
    });
  }
}

export { D2ReviewSubmitter };
