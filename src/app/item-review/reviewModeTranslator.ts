import { t } from 'i18next';
import { DtrUserReview } from './destiny-tracker.service';
import { D2ReviewMode } from '../destinyTrackerApi/reviewModesFetcher';

export function translateReviewMode(reviewModes: D2ReviewMode[], review: DtrUserReview): string {
  if (!reviewModes) {
    return '';
  }

  const matchingMode = reviewModes.find((rm) => rm.mode === review.mode);

  return matchingMode ? matchingMode.description : t('DtrReview.UnknownGameMode');
}
