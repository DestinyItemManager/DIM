import { DestinyAccount } from '../accounts/destiny-account';
import { handleSubmitErrors } from './trackerErrorHandler';
import { loadingTracker } from '../shell/loading-tracker';
import { dtrFetch, dtrD2ReviewsEndpoint } from './dtr-service-helper';
import { DtrReviewer, DimUserReview } from '../item-review/dtr-api-types';
import { ignoreUser } from './userFilter';
import { handleD2SubmitErrors } from './d2-trackerErrorHandler';

function getReporter(membershipInfo: DestinyAccount): DtrReviewer {
  return {
    membershipId: membershipInfo.membershipId,
    membershipType: membershipInfo.originalPlatformType,
    displayName: membershipInfo.displayName,
  };
}

function generateD1ReviewReport(reviewId: string, membershipInfo: DestinyAccount) {
  const reporter = getReporter(membershipInfo);

  return {
    reviewId,
    report: '',
    reporter,
  };
}

function generateD2ReviewReport(reviewId: string, membershipInfo: DestinyAccount) {
  const reporter = getReporter(membershipInfo);

  return {
    reviewId,
    text: '',
    reporter,
  };
}

function submitReportReviewPromise(reviewId: string, membershipInfo: DestinyAccount) {
  const reviewReport =
    membershipInfo.destinyVersion === 1
      ? generateD1ReviewReport(reviewId, membershipInfo)
      : generateD2ReviewReport(reviewId, membershipInfo);

  const errorHandler =
    membershipInfo.destinyVersion === 1 ? handleSubmitErrors : handleD2SubmitErrors;

  const promise = dtrFetch(
    membershipInfo.destinyVersion === 1
      ? 'https://reviews-api.destinytracker.net/api/weaponChecker/reviews/report'
      : `${dtrD2ReviewsEndpoint}/report`,
    reviewReport
  ).then(errorHandler, errorHandler);

  loadingTracker.addPromise(promise);

  return promise;
}

function ignoreReportedUser(review: DimUserReview) {
  const reportedMembershipId = review.reviewer.membershipId;
  return ignoreUser(reportedMembershipId);
}

/**
 * Report a written review.
 * Also quietly adds the associated user to a block list.
 */
export function reportReview(review: DimUserReview, membershipInfo: DestinyAccount | null) {
  if (review.isHighlighted || review.isReviewer || !membershipInfo) {
    return;
  }

  return submitReportReviewPromise(review.id, membershipInfo).then(() =>
    ignoreReportedUser(review)
  );
}
