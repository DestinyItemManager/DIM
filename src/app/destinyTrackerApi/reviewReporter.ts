import { ReviewDataCache } from './reviewDataCache';
import { D1ItemUserReview, DtrReviewer } from '../item-review/destiny-tracker.service';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { handleSubmitErrors } from './trackerErrorHandler';
import { loadingTracker } from '../ngimport-more';
import { dtrFetch } from './dtr-service-helper';
import { ignoreUser } from './userFilter';

/**
 * Class to support reporting bad takes.
 */
export class ReviewReporter {
  _reviewDataCache: ReviewDataCache;
  constructor(reviewDataCache) {
    this._reviewDataCache = reviewDataCache;
  }

  _getReporter(membershipInfo: DestinyAccount): DtrReviewer {
    return {
      membershipId: membershipInfo.membershipId,
      membershipType: membershipInfo.platformType,
      displayName: membershipInfo.displayName
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

    const promise = dtrFetch(
      'https://reviews-api.destinytracker.net/api/weaponChecker/reviews/report',
      reviewReport
    ).then(handleSubmitErrors, handleSubmitErrors);

    loadingTracker.addPromise(promise);

    return promise;
  }

  _ignoreReportedUser(review) {
    const reportedMembershipId = review.reviewer.membershipId;
    ignoreUser(reportedMembershipId);
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
