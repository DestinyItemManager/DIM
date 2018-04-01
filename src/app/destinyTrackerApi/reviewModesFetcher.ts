import { t } from 'i18next';
import { D2ManifestDefinitions } from "../destiny2/d2-definitions.service";

export interface D2ReviewMode {
  mode: number;
  description: string;
}

export function getReviewModes(defs: D2ManifestDefinitions): D2ReviewMode[] {
  return [
    { mode: 0, description: t('DtrReview.ModeNotSpecified') },
    { mode: 7, description: defs.ActivityMode[1164760493].displayProperties.name },
    { mode: 5, description: defs.ActivityMode[1164760504].displayProperties.name },
    { mode: 4, description: defs.ActivityMode[2043403989].displayProperties.name },
    { mode: 39, description: defs.ActivityMode[1370326378].displayProperties.name }
  ];
}
