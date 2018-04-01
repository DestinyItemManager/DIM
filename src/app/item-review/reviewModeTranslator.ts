import { t } from 'i18next';
import { DtrUserReview } from './destiny-tracker.service';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';

export function translateReviewMode(defs: D2ManifestDefinitions, review: DtrUserReview): string {
  switch (review.mode) {
    case 0:
      return t('DtrReview.ModeNotSpecified');
    case 7:
      return defs.ActivityMode[1164760493].displayProperties.name;
    case 5:
      return defs.ActivityMode[1164760504].displayProperties.name;
    case 4:
      return defs.ActivityMode[2043403989].displayProperties.name;
    case 39:
      return defs.ActivityMode[1370326378].displayProperties.name;
    default:
      return t('DtrReview.Modes.UnknownGameMode');
  }
}
