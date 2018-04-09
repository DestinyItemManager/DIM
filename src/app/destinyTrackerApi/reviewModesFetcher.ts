import { t } from 'i18next';
import { D2ManifestDefinitions } from "../destiny2/d2-definitions.service";
import { DtrActivityModes } from '../item-review/destiny-tracker.service';

export interface D2ReviewMode {
  mode: number;
  description: string;
}

enum ActivityModeHashes {
  playerVersusEnemy = 1164760493,
  playerVersusPlayer = 1164760504,
  raid = 2043403989,
  trials = 1370326378
}

export function getReviewModes(defs?: D2ManifestDefinitions): D2ReviewMode[] {
  if (!defs) {
    return [];
  }

  return [
    { mode: DtrActivityModes.notSpecified, description: t('DtrReview.ModeNotSpecified') },
    { mode: DtrActivityModes.playerVersusEnemy, description: defs.ActivityMode[ActivityModeHashes.playerVersusEnemy].displayProperties.name },
    { mode: DtrActivityModes.playerVersusPlayer, description: defs.ActivityMode[ActivityModeHashes.playerVersusPlayer].displayProperties.name },
    { mode: DtrActivityModes.raid, description: defs.ActivityMode[ActivityModeHashes.raid].displayProperties.name },
    { mode: DtrActivityModes.trials, description: defs.ActivityMode[ActivityModeHashes.trials].displayProperties.name }
  ];
}
