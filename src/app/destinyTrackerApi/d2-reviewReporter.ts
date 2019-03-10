import { DestinyAccount } from '../accounts/destiny-account.service';
import { loadingTracker } from '../shell/loading-tracker';
import { handleD2SubmitErrors } from './d2-trackerErrorHandler';
import { dtrFetch } from './dtr-service-helper';
import { DtrReviewer } from '../item-review/dtr-api-types';
import { D2ItemUserReview } from '../item-review/d2-dtr-api-types';
import { ignoreUser } from './userFilter';

export interface DimReviewReport {
  reviewId: string;
  reporter: DtrReviewer;
  text: string;
}

/**
 * Class to support reporting bad takes.
 */
class D2ReviewReporter {
  _getReporter(membershipInfo: DestinyAccount): DtrReviewer {
    return {
      membershipId: membershipInfo.membershipId,
      membershipType: membershipInfo.platformType,
      displayName: membershipInfo.displayName
    };
  }

  _generateReviewReport(reviewId: string, membershipInfo: DestinyAccount): DimReviewReport {
    const reporter = this._getReporter(membershipInfo);

    return {
      reviewId,
      text: '',
      reporter
    };
  }

  _submitReportReviewPromise(reviewId: string, membershipInfo: DestinyAccount) {
    const reviewReport = this._generateReviewReport(reviewId, membershipInfo);
    const promise = dtrFetch(
      'https://db-api.destinytracker.com/api/external/reviews/report',
      reviewReport
    ).then(handleD2SubmitErrors, handleD2SubmitErrors);

    loadingTracker.addPromise(promise);

    return promise;
  }

  _ignoreReportedUser(review: D2ItemUserReview) {
    const reportedMembershipId = review.reviewer.membershipId;
    return ignoreUser(reportedMembershipId);
  }

  /**
   * Report a written review.
   * Also quietly adds the associated user to a block list.
   */
  reportReview(review: D2ItemUserReview, membershipInfo: DestinyAccount | null) {
    if (review.isHighlighted || review.isReviewer || !membershipInfo) {
      return;
    }

    return this._submitReportReviewPromise(review.id, membershipInfo).then(() => {
      review.isIgnored = true;
      this._ignoreReportedUser(review);
    });
  }
}

export { D2ReviewReporter };
