import { D2ItemTransformer } from './d2-itemTransformer';
import { IQService, IHttpService } from 'angular';
import { D2TrackerErrorHandler } from './d2-trackerErrorHandler';
import { D2ReviewDataCache } from './d2-reviewDataCache';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { Reviewer } from './d2-dtr-class-defs';
import { DimItem } from '../inventory/store/d2-item-factory.service';

export interface RatingAndReviewRequest {
  reviewer?: Reviewer;
  voted: number;
  text: string;
  pros: string;
  cons: string;
  isReviewer?: boolean;
  timestamp?: string;
}

/**
 * Supports submitting D2 review data to the DTR API.
 */
class D2ReviewSubmitter {
  _reviewDataCache: D2ReviewDataCache;
  _loadingTracker: any;
  _trackerErrorHandler: D2TrackerErrorHandler;
  _itemTransformer: D2ItemTransformer;
  $http: IHttpService;
  $q: IQService;
  constructor($q, $http, trackerErrorHandler, loadingTracker, reviewDataCache) {
    this.$q = $q;
    this.$http = $http;
    this._itemTransformer = new D2ItemTransformer();
    this._trackerErrorHandler = trackerErrorHandler;
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = reviewDataCache;
  }

  _getReviewer(membershipInfo) {
    return {
      membershipId: membershipInfo.membershipId,
      membershipType: membershipInfo.platformType,
      displayName: membershipInfo.displayName
    };
  }

  toRatingAndReview(item): RatingAndReviewRequest {
    return {
      voted: item.userVote,
      text: item.userReview,
      pros: item.pros,
      cons: item.cons
    };
  }

  _submitItemReviewCall(itemReview) {
    return {
      method: 'POST',
      url: 'https://db-api.destinytracker.com/api/external/reviews/submit',
      data: itemReview,
      dataType: 'json'
    };
  }

  _submitReviewPromise(item: DimItem, membershipInfo: DestinyAccount | null) {
    const rollAndPerks = this._itemTransformer.getRollAndPerks(item);
    const reviewer = this._getReviewer(membershipInfo);
    const review = this.toRatingAndReview(item);

    const rating = { ...rollAndPerks, ...review, ...reviewer };

    const promise = this.$q
              .when(this._submitItemReviewCall(rating))
              .then(this.$http)
              .then(this._trackerErrorHandler.handleSubmitErrors.bind(this._trackerErrorHandler), this._trackerErrorHandler.handleSubmitErrors.bind(this._trackerErrorHandler));

    this._loadingTracker.addPromise(promise);

    return promise;
  }

  // Submitted data takes a while to wend its way into live reviews.  In the interim, don't lose track of what we sent.
  _eventuallyPurgeCachedData(item: DimItem) {
    this._reviewDataCache.eventuallyPurgeCachedData(item);
  }

  _markItemAsReviewedAndSubmitted(item: DimItem, membershipInfo: DestinyAccount | null) {
    const review = this.toRatingAndReview(item);
    review.isReviewer = true;
    review.reviewer = this._getReviewer(membershipInfo);
    review.timestamp = new Date().toISOString();

    this._reviewDataCache.markItemAsReviewedAndSubmitted(item,
                                                         review);
  }

  submitReview(item: DimItem, membershipInfo: DestinyAccount | null) {
    this._submitReviewPromise(item, membershipInfo)
      .then(() => {
        this._markItemAsReviewedAndSubmitted(item, membershipInfo);
        this._eventuallyPurgeCachedData(item);
      });
  }
}

export { D2ReviewSubmitter };
