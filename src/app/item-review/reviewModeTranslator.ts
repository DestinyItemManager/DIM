import { t } from 'i18next';
import { DtrUserReview } from './destiny-tracker.service';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { getReviewModes } from '../destinyTrackerApi/reviewModesFetcher';

export function translateReviewMode(defs: D2ManifestDefinitions, review: DtrUserReview): string {
  const modes = getReviewModes(defs);

  const matchingMode = modes.find((rm) => rm.mode === review.mode);

  return matchingMode ? matchingMode.description : t('DtrReview.Modes.UnknownGameMode');
}
