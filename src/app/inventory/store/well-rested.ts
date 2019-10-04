import {
  DestinyCharacterProgressionComponent,
  DestinyProgressionDefinition,
  DestinySeasonDefinition
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

  const seasonProgressDef = defs.Progression.get(season.seasonPassProgressionHash);
  const seasonProgress = characterProgression.progressions[season.seasonPassProgressionHash];

  const progress = seasonProgress.weeklyProgress;

  const requiredXP =
    xpRequiredForLevel(seasonProgress.level, seasonProgressDef) +
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
