import { t } from 'i18next';
import { D2ReviewMode } from '../destinyTrackerApi/reviewModesFetcher';
import { D2UserReview } from './d2-dtr-api-types';

export function translateReviewMode(reviewModes: D2ReviewMode[], review: D2UserReview): string {
  if (!reviewModes) {
    return '';
  }

  const matchingMode = reviewModes.find((rm) => rm.mode === review.mode);

  return matchingMode ? matchingMode.description : t('DtrReview.UnknownGameMode');
}
