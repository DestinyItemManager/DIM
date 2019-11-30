import {
  DestinyCharacterProgressionComponent,
  DestinyProgressionDefinition,
  DestinySeasonDefinition,
  DestinySeasonPassDefinition
} from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions';

/**
 * Figure out whether a character has the "well rested" buff, which applies a 2x XP boost
 * for the first 5 season levels each week. Ideally this would just come back in the response,
 * but instead we have to calculate it from the weekly XP numbers.
 */
export function isWellRested(
  defs: D2ManifestDefinitions,
  season: DestinySeasonDefinition | undefined,
  seasonPass: DestinySeasonPassDefinition | undefined,
  characterProgression: DestinyCharacterProgressionComponent
): {
  wellRested: boolean;
  progress?: number;
  requiredXP?: number;
} {
  if (!season || !season.seasonPassProgressionHash) {
    return {
      wellRested: false
    };
  }

  const seasonPassProgressionHash = seasonPass?.rewardProgressionHash;
  const prestigeProgressionHash = seasonPass?.prestigeProgressionHash;

  if (!seasonPassProgressionHash || !prestigeProgressionHash) {
    return {
      wellRested: false
    };
  }

  const prestigeMode =
    characterProgression.progressions[seasonPassProgressionHash].level ===
    characterProgression.progressions[seasonPassProgressionHash].levelCap;

  const seasonProgress =
    characterProgression.progressions[
      prestigeMode ? prestigeProgressionHash : seasonPassProgressionHash
    ];

  const seasonProgressDef = defs.Progression.get(seasonPassProgressionHash);
  const prestigeProgressDef = defs.Progression.get(prestigeProgressionHash);

  const progress = seasonProgress.weeklyProgress;

  const requiredXP = prestigeMode
    ? seasonProgress.level >= 5
      ? xpRequiredForLevel(0, prestigeProgressDef) * 5
      : // prettier-ignore
        xpRequiredForLevel(0, prestigeProgressDef) * seasonProgress.level +
        xpRequiredForLevel(seasonProgress.levelCap - 0, seasonProgressDef) * (4 - seasonProgress.level >= 0 ? 1 : 0) +
        xpRequiredForLevel(seasonProgress.levelCap - 1, seasonProgressDef) * (3 - seasonProgress.level >= 0 ? 1 : 0) +
        xpRequiredForLevel(seasonProgress.levelCap - 2, seasonProgressDef) * (2 - seasonProgress.level >= 0 ? 1 : 0) +
        xpRequiredForLevel(seasonProgress.levelCap - 3, seasonProgressDef) * (1 - seasonProgress.level >= 0 ? 1 : 0)
    : xpRequiredForLevel(seasonProgress.level, seasonProgressDef) +
      xpRequiredForLevel(seasonProgress.level - 1, seasonProgressDef) +
      xpRequiredForLevel(seasonProgress.level - 2, seasonProgressDef) +
      xpRequiredForLevel(seasonProgress.level - 3, seasonProgressDef) +
      xpRequiredForLevel(seasonProgress.level - 4, seasonProgressDef);

  // Have you gained XP equal to three full levels worth of XP?
  return {
    wellRested: progress < requiredXP,
    progress,
    requiredXP
  };
}

/**
 * How much XP was required to achieve the given level?
 */
function xpRequiredForLevel(level: number, progressDef: DestinyProgressionDefinition) {
  const stepIndex = Math.min(Math.max(1, level), progressDef.steps.length - 1);
  return progressDef.steps[stepIndex].progressTotal;
}
