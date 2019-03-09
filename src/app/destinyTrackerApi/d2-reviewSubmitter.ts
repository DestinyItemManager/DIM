import { D2ReviewDataCache } from './d2-reviewDataCache';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { loadingTracker } from '../shell/loading-tracker';
import { handleD2SubmitErrors, DtrSubmitResponse } from './d2-trackerErrorHandler';
import { D2Item } from '../inventory/item-types';
import { dtrFetch } from './dtr-service-helper';
import { WorkingD2Rating } from '../item-review/d2-dtr-api-types';
import { DtrReviewer } from '../item-review/dtr-api-types';
import { getRollAndPerks, getReviewKey, getD2Roll } from './d2-itemTransformer';
import { getItemStoreKey } from '../item-review/reducer';
import store from '../store/store';
import { markReviewSubmitted, purgeCachedReview } from '../item-review/actions';

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

  _submitReviewPromise(
    item: D2Item,
    membershipInfo: DestinyAccount | null,
    userReview: WorkingD2Rating
  ) {
    const rollAndPerks = getRollAndPerks(item);
    const reviewer = this._getReviewer(membershipInfo);

    const review = this.toRatingAndReview(userReview);

    const rating: D2ReviewSubmitRequest = { ...rollAndPerks, ...review, reviewer };

    const promise = dtrFetch(
      `https://db-api.destinytracker.com/api/external/reviews/submit`,
      rating
    ).then(handleD2SubmitErrors, handleD2SubmitErrors);

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
  eventuallyPurgeCachedData(item: D2Item) {
    const tenMinutes = 1000 * 60 * 10;

    // TODO: This stuff can be untangled
    const reviewKey = getReviewKey(item);
    const key = getItemStoreKey(item.hash, getD2Roll(reviewKey.availablePerks));

    setTimeout(() => store.dispatch(purgeCachedReview({ key })), tenMinutes);
  }

  async submitReview(
    item: D2Item,
    membershipInfo: DestinyAccount | null,
    userReview?: WorkingD2Rating
  ) {
    if (!userReview) {
      return;
    }

    await this._submitReviewPromise(item, membershipInfo, userReview);

    this.markItemAsReviewedAndSubmitted(item);
    this.eventuallyPurgeCachedData(item);
  }

  markItemAsReviewedAndSubmitted(item: D2Item) {
    // TODO: This stuff can be untangled
    const reviewKey = getReviewKey(item);
    const key = getItemStoreKey(item.hash, getD2Roll(reviewKey.availablePerks));

    store.dispatch(
      markReviewSubmitted({
        key
      })
    );
  }
}

export { D2ReviewSubmitter };
