/**
 * Class to support reporting bad takes.
 *
 * @class D2ReviewReporter
 */
class D2ReviewReporter {
  constructor($q, $http, dimPlatformService, trackerErrorHandler, loadingTracker, reviewDataCache, userFilter) {
    this.$q = $q;
    this.$http = $http;
    this._trackerErrorHandler = trackerErrorHandler;
    this._dimPlatformService = dimPlatformService;
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = reviewDataCache;
    this._userFilter = userFilter;
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
      url: 'https://db-api.destinytracker.com/api/external/reviews/report',
      data: reviewReport,
      dataType: 'json'
    };
  }

  _generateReviewReport(reviewId) {
    const reporter = this._getReporter();

    return {
      reviewId: reviewId,
      report: "",
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

  _ignoreReportedUser(review) {
    const reportedMembershipId = review.reviewer.membershipId;
    this._userFilter.ignoreUser(reportedMembershipId);
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
        .then(this._reviewDataCache.markReviewAsIgnored(review))
        .then(this._ignoreReportedUser(review));
  }
}

export { D2ReviewReporter };
