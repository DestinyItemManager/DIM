import { D2ReviewDataCache } from "./d2-reviewDataCache";
import { DestinyAccount } from "../accounts/destiny-account.service";
import { UserFilter } from "./userFilter";
import { loadingTracker } from "../ngimport-more";
import { handleD2SubmitErrors } from "./d2-trackerErrorHandler";
import { dtrFetch } from "./dtr-service-helper";
import { DtrReviewer } from "../item-review/dtr-api-types";
import { DtrUserReview } from "../item-review/d2-dtr-api-types";

export interface DimReviewReport {
  reviewId: string;
  reporter: DtrReviewer;
  text: string;
}

/**
 * Class to support reporting bad takes.
 */
class D2ReviewReporter {
  _userFilter = new UserFilter();
  _reviewDataCache: D2ReviewDataCache;
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

  _generateReviewReport(reviewId: string, membershipInfo: DestinyAccount): DimReviewReport {
    const reporter = this._getReporter(membershipInfo);

    return {
      reviewId,
      text: "",
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

  _ignoreReportedUser(review: DtrUserReview) {
    const reportedMembershipId = review.reviewer.membershipId;
    this._userFilter.ignoreUser(reportedMembershipId);
  }

  /**
   * Report a written review.
   * Also quietly adds the associated user to a block list.
   */
  reportReview(review: DtrUserReview, membershipInfo: DestinyAccount | null) {
    if (review.isHighlighted || review.isReviewer || !membershipInfo) {
      return;
    }

    this._submitReportReviewPromise(review.id, membershipInfo)
        .then(() => {
          this._reviewDataCache.markReviewAsIgnored(review);
          this._ignoreReportedUser(review);
        });
  }
}

export { D2ReviewReporter };
