import { t } from 'i18next';
import { DtrUserReview } from './destiny-tracker.service';

export function getReviewMode(review: DtrUserReview): string {
  switch (review.mode) {
    case 0:
      return t('DtrReview.Modes.None');
    case 7:
      return t('DtrReview.Modes.AllPvE');
    case 5:
      return t('DtrReview.Modes.AllPvP');
    case 4:
      return t('DtrReview.Modes.Raid');
    case 39:
      return t('DtrReview.Modes.TrialsOfTheNine');
    default:
      return t('DtrReview.Modes.UnknownGameMode');
  }
}
