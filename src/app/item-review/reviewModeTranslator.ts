import { t } from 'i18next';
import { D2ReviewMode } from '../destinyTrackerApi/reviewModesFetcher';
import { DtrUserReview } from './d2-dtr-api-types';

export function translateReviewMode(reviewModes: D2ReviewMode[], review: DtrUserReview): string {
  if (!reviewModes) {
    return '';
  }

  const matchingMode = reviewModes.find((rm) => rm.mode === review.mode);

  return matchingMode ? matchingMode.description : t('DtrReview.UnknownGameMode');
}
