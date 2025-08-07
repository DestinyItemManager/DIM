import type { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { getSeasonPassStatus } from 'app/progress/SeasonalRank';
import { sumBy } from 'app/utils/collections';
import { errorLog } from 'app/utils/log';
import { getCurrentSeasonInfo } from 'app/utils/seasons';
import type { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import type { DimItem } from './item-types';
import type { DimStore } from './store-types';

// Temporary solution. Might need to be created with d2ai?
// These bonuses are hard to programatically identify, they're just dummies.
const activityScoreBoosts = new Set([3858293505, 3858293504, 3858293507, 3858293506, 3858293509]);

// Per https://redd.it/1m5obsu, thanks u/Testifye, Reward Multiplier is based on your Gear's Power,
// multiplied by a combination of its Newness/Featuredness and Season Pass bonuses.
// 10,000 * C * ( ( G + A + 1 ) * ( ( P - 90 ) * ( 9 / 460 ) + 1 ) )

export function getRewardMultiplier(
  defs: D2ManifestDefinitions,
  profileInfo: DestinyProfileResponse,
  gear: DimStore | DimItem[],
) {
  const equippedGear =
    'id' in gear
      ? gear?.items.filter((i) => i.equipped && (i.bucket.inWeapons || i.bucket.inArmor))
      : gear;

  if (equippedGear.length !== 8) {
    errorLog('RewardMultiplier', `getRewardMultiplier called with ${equippedGear.length} items`);
    return null;
  }

  // Treat gearMultiplier as a whole number percentage first for math precision. 10 = 10%
  // 1% for each featured item
  let gearMultiplier = equippedGear.filter((i) => i.featured).length;
  // 2% additional bonus for using all featured gear.
  if (gearMultiplier === 8) {
    gearMultiplier = 10;
  }

  //  Activity score boosts come from the season pass
  const { season, seasonPass } = getCurrentSeasonInfo(defs, profileInfo);
  if (!season || !seasonPass) {
    errorLog('RewardMultiplier', `getRewardMultiplier called with no season/pass available?`);
    return null;
  }

  const { seasonPassLevel, seasonProgressionDef } = getSeasonPassStatus(
    defs,
    profileInfo,
    seasonPass,
    season,
  );
  const activityUnlocks = seasonProgressionDef.rewardItems.filter(
    (i) => i.rewardedAtProgressionLevel >= seasonPassLevel && activityScoreBoosts.has(i.itemHash),
  ).length;
  // There are 5 collectible bonuses, each contributing 3%
  gearMultiplier += activityUnlocks * 3;

  // Convert this into a multipliable ratio number. 25% becomes 1.25
  gearMultiplier = 1 + 0.01 * gearMultiplier;

  // The power multiplier, starting at 0, can reach 9x, leading to the 9 numerator here.
  // Power level gains, from PL90 to PL550, affect the bonus linearly, so there are 460 increments (460 denominator).
  const equippedPowerLevel = Math.floor(sumBy(equippedGear, (i) => i.power) / 8);
  const powerBeyond90 = Math.max(equippedPowerLevel - 90, 0);
  const powerMultiplier = 1 + powerBeyond90 * (9 / 460);

  return powerMultiplier * gearMultiplier;
}
