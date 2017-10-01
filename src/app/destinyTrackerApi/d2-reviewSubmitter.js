import { D2ItemTransformer } from './d2-itemTransformer';

/**
 * Supports submitting review data to the DTR API.
 *
 * @class ReviewSubmitter
 */
class D2ReviewSubmitter {
  constructor($q, $http, dimPlatformService, trackerErrorHandler, loadingTracker, reviewDataCache) {
    this.$q = $q;
    this.$http = $http;
    this._itemTransformer = new D2ItemTransformer();
    this._trackerErrorHandler = trackerErrorHandler;
    this._dimPlatformService = dimPlatformService;
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = reviewDataCache;
  }

  _getReviewer() {
    const membershipInfo = this._dimPlatformService.getActive();

    return {
      membershipId: membershipInfo.membershipId,
      membershipType: membershipInfo.platformType,
      displayName: membershipInfo.displayName
    };
  }

  toRatingAndReview(item) {
    return {
      rating: item.userRating,
      review: item.userReview,
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

  _submitReviewPromise(item) {
    const rollAndPerks = this._itemTransformer.getRollAndPerks(item);
    const reviewer = this._getReviewer();
    const review = this.toRatingAndReview(item);

    const rating = Object.assign(rollAndPerks, review);
    rating.reviewer = reviewer;

    const promise = this.$q
              .when(this._submitItemReviewCall(rating))
              .then(this.$http)
              .then(this._trackerErrorHandler.handleSubmitErrors.bind(this._trackerErrorHandler), this._trackerErrorHandler.handleSubmitErrors.bind(this._trackerErrorHandler));

    this._loadingTracker.addPromise(promise);

    return promise;
  }

  // Submitted data takes a while to wend its way into live reviews.  In the interim, don't lose track of what we sent.
  _eventuallyPurgeCachedData(item) {
    this._reviewDataCache.eventuallyPurgeCachedData(item);
  }

  _markItemAsReviewedAndSubmitted(item) {
    const review = this.toRatingAndReview(item);
    review.isReviewer = true;
    review.reviewer = this._getReviewer();
    review.timestamp = new Date().toISOString();

    this._reviewDataCache.markItemAsReviewedAndSubmitted(item,
                                                         review);
  }

  submitReview(item) {
    this._submitReviewPromise(item)
      .then(this._markItemAsReviewedAndSubmitted(item))
      .then(this._eventuallyPurgeCachedData(item));
  }
}

export { D2ReviewSubmitter };
