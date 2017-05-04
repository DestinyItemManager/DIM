import { itemTransformer } from './itemTransformer.js';

class reviewSubmitter {
  constructor($q, $http, dimPlatformService, trackerErrorHandler, loadingTracker, scoreMaintainer) {
    this.$q = $q;
    this.$http = $http;
    this._itemTransformer = new itemTransformer();
    this._trackerErrorHandler = trackerErrorHandler;
    this._dimPlatformService = dimPlatformService;
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = scoreMaintainer;
  }

  getReviewer() {
    var membershipInfo = this._dimPlatformService.getActive();

    return {
      membershipId: membershipInfo.membershipId,
      type: membershipInfo.type,
      displayName: membershipInfo.id
    };
  }

  toRatingAndReview(userReview) {
    return {
      rating: userReview.rating,
      review: userReview.review,
      pros: userReview.pros,
      cons: userReview.cons
    };
  }

  submitItemReviewCall(itemReview) {
    return {
      method: 'POST',
      url: 'https://reviews-api.destinytracker.net/api/weaponChecker/reviews/submit',
      data: itemReview,
      dataType: 'json'
    };
  }

  submitReviewPromise(item, userReview) {
    var rollAndPerks = this._itemTransformer.getRollAndPerks(item);
    var reviewer = this.getReviewer();
    var review = this.toRatingAndReview(userReview);

    var rating = Object.assign(rollAndPerks, review);
    rating.reviewer = reviewer;

    var promise = this.$q
              .when(this.submitItemReviewCall(rating))
              .then(this.$http)
              .then(this._trackerErrorHandler.handleSubmitErrors, this._trackerErrorHandler.handleSubmitErrors);

    this._loadingTracker.addPromise(promise);

    return promise;
  }

  eventuallyPurgeCachedData(item) {
    this._reviewDataCache.eventuallyPurgeCachedData(item);
  }

  submitReview(item, userReview) {
    this.submitReviewPromise(item, userReview)
      .then(this.eventuallyPurgeCachedData(item));
  }
}

export { reviewSubmitter };