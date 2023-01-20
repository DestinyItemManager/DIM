import { WellRestedInfo } from 'app/inventory/store/well-rested';

/** Map inventory item ID to XP value */
const xpItems = {
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
export function getXPValue(hash: number, wellRestedInfo?: WellRestedInfo) {
  let xpValue = xpItems[hash];
  if (!xpValue) {
    return;
  }
  if (wellRestedInfo?.wellRested) {
    xpValue = xpValue * 2;
    const remaining = wellRestedInfo.requiredXP - wellRestedInfo.progress;

    if (xpValue > remaining) {
      // Only the part that gets you to the 5th season rank gets doubled? I don't actually know, just guessing it works that
      xpValue = remaining + Math.floor((xpValue - remaining) / 2);
    }
  }
  return xpValue;
}
