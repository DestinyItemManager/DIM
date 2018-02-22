import { IQService, IHttpService } from "angular";
import { D2TrackerErrorHandler } from "./d2-trackerErrorHandler";
import { D2ReviewDataCache } from "./d2-reviewDataCache";

/**
 * Class to support reporting bad takes.
 */
class D2ReviewReporter {
  _userFilter: any;
  _reviewDataCache: D2ReviewDataCache;
  _loadingTracker: any;
  _trackerErrorHandler: D2TrackerErrorHandler;
  $http: IHttpService;
  $q: IQService;
  constructor($q, $http, trackerErrorHandler, loadingTracker, reviewDataCache, userFilter) {
    this.$q = $q;
    this.$http = $http;
    this._trackerErrorHandler = trackerErrorHandler;
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = reviewDataCache;
    this._userFilter = userFilter;
  }

  _getReporter(membershipInfo) {
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

  _generateReviewReport(reviewId, membershipInfo) {
    const reporter = this._getReporter(membershipInfo);

    return {
      reviewId: reviewId,
      text: "",
      reporter: reporter
    };
  }

  _submitReportReviewPromise(reviewId, membershipInfo) {
    const reviewReport = this._generateReviewReport(reviewId, membershipInfo);

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
   */
  reportReview(review, membershipInfo) {
    if (review.isHighlighted || review.isReviewer) {
      return;
    }

    this._submitReportReviewPromise(review.id, membershipInfo)
        .then(this._reviewDataCache.markReviewAsIgnored(review))
        .then(this._ignoreReportedUser(review));
  }
}

export { D2ReviewReporter };
