/**
 * Class to support reporting bad takes.
 *
 * @class ReviewReporter
 */
class ReviewReporter {
  constructor($q, $http, dimPlatformService, trackerErrorHandler, loadingTracker) {
    this.$q = $q;
    this.$http = $http;
    this._trackerErrorHandler = trackerErrorHandler;
    this._dimPlatformService = dimPlatformService;
    this._loadingTracker = loadingTracker;
  }

  /**
   * Report a written review.
   * Also quietly adds the associated user to a block list.
   * 
   * @param {review} review 
   * @memberof ReviewReporter
   */
  reportReview(review) {
    if (review.isHighlighted || review.isReviewer) {
      return;
    }

    console.log(review.reviewId);
  }
}

export { ReviewReporter };
