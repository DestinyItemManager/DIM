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

  const WELL_RESTED_LEVELS = 5;
  const seasonPassProgressionHash = seasonPass?.rewardProgressionHash;
  const prestigeProgressionHash = seasonPass?.prestigeProgressionHash;

  if (!seasonPassProgressionHash || !prestigeProgressionHash) {
    return {
      wellRested: false
    };
  }

  const seasonProgress = characterProgression.progressions[seasonPassProgressionHash];
  const prestigeProgress = characterProgression.progressions[prestigeProgressionHash];

  const prestigeMode = seasonProgress.level === seasonProgress.levelCap;

  const seasonProgressDef = defs.Progression.get(seasonPassProgressionHash);
  const prestigeProgressDef = defs.Progression.get(prestigeProgressionHash);

  if (seasonProgressDef.steps.length === seasonProgress.levelCap) {
    for (let i = 0; i < WELL_RESTED_LEVELS; i++) {
      seasonProgressDef.steps.push(prestigeProgressDef.steps[0]);
    }
  }

  const totalLevel = prestigeMode
    ? seasonProgress.level + prestigeProgress.level
    : seasonProgress.level;

  const progress = prestigeMode ? prestigeProgress.weeklyProgress : seasonProgress.weeklyProgress;

  const requiredXP =
    prestigeMode && prestigeProgress.level >= WELL_RESTED_LEVELS
      ? xpRequiredForLevel(0, prestigeProgressDef) * WELL_RESTED_LEVELS
      : xpTotalRequiredForLevel(totalLevel, seasonProgressDef, WELL_RESTED_LEVELS);

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

function xpTotalRequiredForLevel(totalLevel, seasonProgressDef, WELL_RESTED_LEVELS) {
  let totalXP = 0;
  for (let i = 0; i < WELL_RESTED_LEVELS; i++) {
    totalXP += xpRequiredForLevel(totalLevel - i, seasonProgressDef);
  }
  return totalXP;
}
