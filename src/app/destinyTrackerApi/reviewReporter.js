/**
 * Class to support reporting bad takes.
 *
 * @class ReviewReporter
 */
class ReviewReporter {
  constructor($q, $http, dimPlatformService, trackerErrorHandler, loadingTracker, reviewDataCache) {
    this.$q = $q;
    this.$http = $http;
    this._trackerErrorHandler = trackerErrorHandler;
    this._dimPlatformService = dimPlatformService;
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = reviewDataCache;
  }

  _getReporter() {
    const membershipInfo = this._dimPlatformService.getActive();

    return {
      membershipId: membershipInfo.membershipId,
      membershipType: membershipInfo.platformType,
      displayName: membershipInfo.displayName
    };
  }

  _submitReviewReportCall(reviewReport) {
    return {
      method: 'POST',
      url: 'https://reviews-api.destinytracker.net/api/weaponChecker/reviews/report',
      data: reviewReport,
      dataType: 'json'
    };
  }

  _generateReviewReport(reviewId) {
    const reporter = this._getReporter();

    return {
      reviewId: reviewId,
      reporter: reporter
    };
  }

  _submitReportReviewPromise(reviewId) {
    const reviewReport = this._generateReviewReport(reviewId);

    const promise = this.$q
              .when(this._submitReviewReportCall(reviewReport))
              .then(this.$http)
              .then(this._trackerErrorHandler.handleSubmitErrors.bind(this._trackerErrorHandler), this._trackerErrorHandler.handleSubmitErrors.bind(this._trackerErrorHandler));

    this._loadingTracker.addPromise(promise);

    return promise;
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

    this._submitReportReviewPromise(review.reviewId)
      .then(this._reviewDataCache.markReviewAsIgnored(review));
  }
}

export { ReviewReporter };
