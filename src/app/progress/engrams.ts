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

/**
 * How much above the player's current max power will this reward drop?
 */
export function getEngramPowerBonus(itemHash: number, maxPower?: number) {
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
    // Once you're at or above the powerful cap, pinnacles only give +2, up to the hard cap
    const pinnacleCap = Math.min(season.pinnacleCap, Math.max(maxPower, powerfulCap) + 2);
    return _.clamp(pinnacleCap - maxPower, 0, engramInfo.bonus);
  }
}
