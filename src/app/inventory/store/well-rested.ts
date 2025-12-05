import { getSeasonPassStatus } from 'app/progress/SeasonalRank';
import { useCurrentSeasonInfo } from 'app/utils/seasons';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions';

/**
 * Figure out whether a character has the "well rested" buff, which applies a 2x XP boost
 * for the first 5 season levels each week. Ideally this would just come back in the response,
 * but instead we have to calculate it from the weekly XP numbers.
 */
export function useIsWellRested(
  defs: D2ManifestDefinitions,
  profileInfo: DestinyProfileResponse,
): {
  /** Is the "well rested" buff active? */
  wellRested: boolean;
  /** How much of the well rested XP has been earned so far this week? */
  weeklyProgress?: number;
  /**
   * How much XP total needs to be earned in a week before the character is no
   * longer "well rested"?
   */
  requiredXP?: number;
} {
  const { season, seasonPass } = useCurrentSeasonInfo(defs, profileInfo);
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

  const { weeklyProgress } = getSeasonPassStatus(defs, profileInfo, seasonPass, season);

  // 5 levels worth of XP at 100k each. We used to calculate this dynamically
  // but this has been 500k consistently and the calculation is no longer easy
  // as the definitions don't agree with the game (Ranks 101-110 are displayed
  // in game as 5 segments, each of which is equivalent to one regular levels at
  // 100k, but in the defs they are a single 500k level).
  const requiredXP = 500_000;

  return {
    wellRested: weeklyProgress < requiredXP,
    weeklyProgress,
    requiredXP,
  };
}
