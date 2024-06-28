import { powerLevelByKeyword } from 'app/search/power-levels';
import { HashLookup } from 'app/utils/util-types';
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

const engrams: HashLookup<{ cap: PowerCap; bonus: number }> = {
  // Pinnacle
  73143230: {
    cap: PowerCap.Pinnacle,
    bonus: 5,
  },
  // Pinnacle Deepsight Weapon
  323631491: {
    cap: PowerCap.Pinnacle,
    bonus: 5,
  },
  // Prime Engram from Pathfinder
  853937142: {
    cap: PowerCap.Pinnacle,
    bonus: 5,
  },
  // Tier 1
  3114385605: {
    cap: PowerCap.Powerful,
    bonus: 3,
  },
  // Tier 1 Exotic
  2643364263: {
    cap: PowerCap.Powerful,
    bonus: 3,
  },
  // Powerful
  4039143015: {
    cap: PowerCap.Powerful,
    bonus: 3,
  },
  // Tier 2
  3114385606: {
    cap: PowerCap.Powerful,
    bonus: 4,
  },
  // Rose (from Competitive)
  882778888: {
    cap: PowerCap.Powerful,
    bonus: 4,
  },
  // Tier 3
  3114385607: {
    cap: PowerCap.Powerful,
    bonus: 5,
  },
};

/**
 * How much above the player's current max power will this reward drop?
 */
export function getEngramPowerBonus(
  itemHash: number,
  maxPower?: number,
  parentItemHash?: number,
): [powerLevel: number | undefined, itemHash: number] {
  if (parentItemHash === 3603098564) {
    // Hawthorne's Clan Rewards gives out a +2 pinnacle even though it's listed as a powerful
    itemHash = 73143230;
  } else if (parentItemHash === 3243997895) {
    // Captain's Log is a powerful level 2 even though it's listed as a pinnacle.
    itemHash = 3114385606;
  } else if (parentItemHash === 373284212) {
    // Enterprising Explorer II is powerful level 2
    itemHash = 3114385606;
  } else if (parentItemHash === 373284213) {
    // Enterprising Explorer III is powerful level 3
    itemHash = 3114385607;
  }

  const engramInfo = engrams[itemHash];
  if (engramInfo) {
    maxPower ||= 0;
    maxPower = Math.floor(maxPower);
    const powerfulCap = powerLevelByKeyword.powerfulcap;
    if (engramInfo.cap === PowerCap.Powerful) {
      // Powerful engrams can't go above the powerful cap
      return [_.clamp(powerfulCap - maxPower, 0, engramInfo.bonus), itemHash];
    } else if (engramInfo.cap === PowerCap.Pinnacle) {
      // Once you're at or above the powerful cap, pinnacles only give +2, up to the hard cap
      const pinnacleCap = Math.min(
        powerLevelByKeyword.pinnaclecap,
        Math.max(maxPower, powerfulCap) + 2,
      );
      return [_.clamp(pinnacleCap - maxPower, 0, engramInfo.bonus), itemHash];
    }
  }

  return [undefined, itemHash];
}
