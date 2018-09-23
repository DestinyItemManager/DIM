import { t } from 'i18next';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { DtrD2ActivityModes } from '../item-review/d2-dtr-api-types';

export interface D2ReviewMode {
  mode: number;
  description: string;
}

enum ActivityModeHashes {
  playerVersusEnemy = 1164760493,
  playerVersusPlayer = 1164760504,
  raid = 2043403989,
  trials = 1370326378,
  gambit = 1848252830
}

export function getReviewModes(defs?: D2ManifestDefinitions): D2ReviewMode[] {
  if (!defs) {
    return [];
  }

  return [
    { mode: DtrD2ActivityModes.notSpecified, description: t('DtrReview.ModeNotSpecified') },
    {
      mode: DtrD2ActivityModes.playerVersusEnemy,
      description: defs.ActivityMode[ActivityModeHashes.playerVersusEnemy].displayProperties.name
    },
    {
      mode: DtrD2ActivityModes.playerVersusPlayer,
      description: defs.ActivityMode[ActivityModeHashes.playerVersusPlayer].displayProperties.name
    },
    {
      mode: DtrD2ActivityModes.raid,
      description: defs.ActivityMode[ActivityModeHashes.raid].displayProperties.name
    },
    // { mode: DtrD2ActivityModes.trials, description: defs.ActivityMode[ActivityModeHashes.trials].displayProperties.name }
    {
      mode: DtrD2ActivityModes.gambit,
      description: defs.ActivityMode[ActivityModeHashes.gambit].displayProperties.name
    }
  ];
}
