import { ItemTransformer } from './itemTransformer';

/**
 * Supports submitting review data to the DTR API.
 *
 * @class ReviewSubmitter
 */
class ReviewSubmitter {
  constructor($q, $http, dimPlatformService, trackerErrorHandler, loadingTracker, scoreMaintainer) {
    this.$q = $q;
    this.$http = $http;
    this._itemTransformer = new ItemTransformer();
    this._trackerErrorHandler = trackerErrorHandler;
    this._dimPlatformService = dimPlatformService;
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = scoreMaintainer;
  }

  _getReviewer() {
    const membershipInfo = this._dimPlatformService.getActive();

    return {
      membershipId: membershipInfo.membershipId,
      membershipType: membershipInfo.type,
      displayName: membershipInfo.id
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
      url: 'https://reviews-api.destinytracker.net/api/weaponChecker/reviews/submit',
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

    this._reviewDataCache.markItemAsReviewedAndSubmitted(item,
                                                         userReview);
  }

  submitReview(item) {
    this._submitReviewPromise(item)
      .then(this._eventuallyPurgeCachedData(item));
  }
}

export { ReviewSubmitter };
