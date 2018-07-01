import { t } from 'i18next';
import { D2ReviewMode } from '../destinyTrackerApi/reviewModesFetcher';
import { D2ItemUserReview } from './d2-dtr-api-types';

export function translateReviewMode(reviewModes: D2ReviewMode[], review: D2ItemUserReview): string {
  if (!reviewModes) {
    return '';
  }

  const matchingMode = reviewModes.find((rm) => rm.mode === review.mode);

  return matchingMode ? matchingMode.description : t('DtrReview.UnknownGameMode');
}
