import { $q, $http } from 'ngimport';
import { ReviewDataCache } from './reviewDataCache';
import { D1ItemUserReview, D1MembershipInfo } from '../item-review/destiny-tracker.service';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { UserFilter } from './userFilter';
import { handleSubmitErrors } from './trackerErrorHandler';

/**
 * Class to support reporting bad takes.
 */
export class ReviewReporter {
  _userFilter = new UserFilter();
  _reviewDataCache: ReviewDataCache;
  _loadingTracker: any;
  constructor(loadingTracker, reviewDataCache) {
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = reviewDataCache;
  }

  _getReporter(membershipInfo: DestinyAccount): D1MembershipInfo {
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

  _generateReviewReport(reviewId, membershipInfo: DestinyAccount) {
    const reporter = this._getReporter(membershipInfo);

    return {
      reviewId,
      report: "",
      reporter
    };
  }

  _submitReportReviewPromise(reviewId, membershipInfo) {
    const reviewReport = this._generateReviewReport(reviewId, membershipInfo);

    const promise = $q
              .when(this._submitReviewReportCall(reviewReport))
              .then($http)
              .then(handleSubmitErrors);

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
  reportReview(review: D1ItemUserReview, membershipInfo: DestinyAccount | null) {
    if (review.isHighlighted || review.isReviewer || !membershipInfo) {
      return;
    }

    this._submitReportReviewPromise(review.reviewId, membershipInfo)
      .then(() => this._reviewDataCache.markReviewAsIgnored(review))
      .then(() => this._ignoreReportedUser(review));
  }
}
