import { HashLookup } from 'app/utils/util-types';

/** Map inventory item ID to XP value */
export const xpItems: HashLookup<number> = {
  1858002338: 4000, // XP
  3348653032: 6000, // XP+
  3582080006: 12000, // XP++
  2174060729: 25000, // Challenger XP
  691393048: 50000, // Challenger XP+
  2250176030: 100000, // Challenger XP++
  1711513650: 200000, // Challenger XP+++
};

/**
 * If this is an XP item, return how much XP it grants. This is based on hardcoded community research.
 * https://www.reddit.com/r/DestinyTheGame/comments/pp4chw/how_many_xps_is/
 */
export function getXPValue(hash: number) {
  return xpItems[hash];
}
