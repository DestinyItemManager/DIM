import { D2CalculatedSeason, D2SeasonInfo } from 'data/d2/d2-season-info';
import _ from 'lodash';

/**
 * Logic for determining how much power bonus an engram can provide.
 */

const enum PowerCap {
  /** Pinnacle engrams can go up to +2 over the powerful cap, up to the hard cap */
  Pinnacle,
  /** Powerful engrams cannot go above the powerful cap */
  Powerful,
}

const engrams = {
  // Pinnacle
  73143230: {
    cap: PowerCap.Pinnacle,
    bonus: 5,
  },
  // Tier 1
  3114385605: {
    cap: PowerCap.Powerful,
    bonus: 3,
  },
  // Powerful
  4039143015: {
    cap: PowerCap.Powerful,
    bonus: 3,
  },
  // Powerful Legacy
  2246571627: {
    cap: PowerCap.Powerful,
    bonus: 3,
  },
  // Tier 2
  3114385606: {
    cap: PowerCap.Powerful,
    bonus: 4,
  },
  // Tier 3
  3114385607: {
    cap: PowerCap.Powerful,
    bonus: 5,
  },
};

// Milestone hashes for milestones that reward +1 pinnacles instead of +2
const plusOnePinnacles = [
  3448738070, // Weekly Gambit Challenge
  1437935813, // Weekly Vanguard Strikes
  3312774044, // Crucible Playlist Challenge
  3603098564, // Clan Rewards (Hawthorne's 5,000 clan XP challenge)
];

/**
 * How much above the player's current max power will this reward drop?
 */
export function getEngramPowerBonus(itemHash: number, maxPower?: number, parentItemHash?: number) {
  // Hawthorne's Clan Rewards gives out a +1 pinnacle even though it's listed as a powerful
  if (parentItemHash === 3603098564) {
    itemHash = 73143230;
  }

  // Season of Plunder vendor 8 bounties challenge (The Astral Seas) gives a T1 powerful
  // even though it's listed as a pinnacle in the API
  if (parentItemHash === 1194402836) {
    itemHash = 3114385605;
  }

  const engramInfo: {
    cap: PowerCap;
    bonus: number;
  } = engrams[itemHash];
  if (!engramInfo) {
    return undefined;
  }

  maxPower ||= 0;
  maxPower = Math.floor(maxPower);
  const season = D2SeasonInfo[D2CalculatedSeason];
  const powerfulCap = season.powerfulCap;
  if (engramInfo.cap === PowerCap.Powerful) {
    // Powerful engrams can't go above the powerful cap
    return _.clamp(powerfulCap - maxPower, 0, engramInfo.bonus);
  } else if (engramInfo.cap === PowerCap.Pinnacle) {
    const pinnacleBonus = parentItemHash && plusOnePinnacles.includes(parentItemHash) ? 1 : 2;
    // Once you're at or above the powerful cap, pinnacles only give +2, up to the hard cap
    const pinnacleCap = Math.min(
      season.pinnacleCap,
      Math.max(maxPower, powerfulCap) + pinnacleBonus
    );
    return _.clamp(pinnacleCap - maxPower, 0, engramInfo.bonus);
  }
}
