import { getSeasonPassStatus } from 'app/progress/SeasonalRank';
import { getCurrentSeasonInfo } from 'app/utils/seasons';
import { DestinyProfileResponse, DestinyProgressionDefinition } from 'bungie-api-ts/destiny2';
import { clamp } from 'es-toolkit';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions';

/**
 * Figure out whether a character has the "well rested" buff, which applies a 2x XP boost
 * for the first 5 season levels each week. Ideally this would just come back in the response,
 * but instead we have to calculate it from the weekly XP numbers.
 */
export function isWellRested(
  defs: D2ManifestDefinitions,
  profileInfo: DestinyProfileResponse,
): {
  wellRested: boolean;
  weeklyProgress?: number;
  requiredXP?: number;
} {
  const { season, seasonPass } = getCurrentSeasonInfo(defs, profileInfo);
  if (!season) {
    return {
      wellRested: false,
    };
  }

  const seasonPassProgressionHash = seasonPass?.rewardProgressionHash;
  const prestigeProgressionHash = seasonPass?.prestigeProgressionHash;

  if (!seasonPassProgressionHash || !prestigeProgressionHash) {
    return {
      wellRested: false,
    };
  }

  const {
    seasonPassLevel,
    seasonProgression,
    prestigeMode,
    prestigeProgression,
    prestigeProgressionDef,
    seasonProgressionDef,
    weeklyProgress,
    nextLevelAt,
  } = getSeasonPassStatus(defs, profileInfo, seasonPass, season);

  /**
   *  Calculate the amount of levels we need to fullfill well rested requirements
   *  Ranks 101-110 are equiv to 5 levels each
   */
  const baseLevelXPRequirement = seasonProgressionDef?.steps[1]?.progressTotal ?? 100000;
  const wellRestedLevels = (baseLevelXPRequirement * 5) / nextLevelAt;

  if (seasonProgressionDef.steps.length === seasonProgression.levelCap) {
    for (let i = 0; i < wellRestedLevels; i++) {
      seasonProgressionDef.steps.push(prestigeProgressionDef.steps[0]);
    }
  }

  const requiredXP =
    prestigeMode && prestigeProgression.level >= wellRestedLevels
      ? xpRequiredForLevel(0, prestigeProgressionDef) * wellRestedLevels
      : xpTotalRequiredForLevel(seasonPassLevel, seasonProgressionDef, wellRestedLevels);

  // Have you gained XP equal to three full levels worth of XP?
  return {
    wellRested: weeklyProgress < requiredXP,
    weeklyProgress,
    requiredXP,
  };
}

/**
 * How much XP was required to achieve the given level?
 */
function xpRequiredForLevel(level: number, progressDef: DestinyProgressionDefinition) {
  const stepIndex = clamp(level, 0, progressDef.steps.length - 1);
  return progressDef.steps[stepIndex].progressTotal;
}

function xpTotalRequiredForLevel(
  totalLevel: number,
  seasonProgressDef: DestinyProgressionDefinition,
  WELL_RESTED_LEVELS: number,
) {
  let totalXP = 0;
  for (let i = 0; i < WELL_RESTED_LEVELS; i++) {
    totalXP += xpRequiredForLevel(totalLevel - i, seasonProgressDef);
  }
  return totalXP;
}
