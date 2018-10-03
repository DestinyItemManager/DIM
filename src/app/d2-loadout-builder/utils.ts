import { SetType, ArmorSet, LockType } from './types';
import { sum } from '../util';

/**
 *  Filter out plugs that we don't want to show in the perk dropdown.
 */
export function filterPlugs(socket) {
  // filter out Mobility, Restorative, and Resilience mods
  if (socket.plug && ![3530997750, 2032054360, 1633794450].includes(socket.plug.plugItem.hash)) {
    // Filters out "Heavy Warlock Armor", for example
    if (
      socket.plug.plugItem.inventory.tierType !== 6 &&
      socket.plug.plugItem.plug.plugCategoryHash === 1744546145
    ) {
      return false;
    }
    return true;
  }
}

/**
 * Get the best sorted computed sets for a specfic tier
 */
export function getSetsForTier(
  setMap: { [setHash: string]: SetType },
  lockedMap: { [bucketHash: number]: LockType },
  tier: string
): ArmorSet[] {
  const matchedSets: ArmorSet[] = [];
  let count = 0;

  // TODO: this lookup by tier is expensive
  Object.values(setMap).forEach((setType) => {
    if (count > 10) {
      return;
    }

    if (setType.tiers[tier]) {
      matchedSets.push(setType.set);
      count++;
    }
  });

  // Sort based on power level
  matchedSets.sort((a, b) => b.power - a.power);

  // Prioritize list based on number of matched perks
  Object.keys(lockedMap).forEach((bucket) => {
    // if there are locked items for this bucket
    if (lockedMap[bucket] && lockedMap[bucket].items.length && lockedMap[bucket].type === 'perk') {
      // Sort based on what sets have the most matched perks
      matchedSets.sort((a, b) => {
        return (
          sum(b.armor, (item) => {
            if (!item || !item.sockets) {
              return 0;
            }
            return item.sockets.sockets.filter((slot) =>
              slot.plugOptions.find((perk) =>
                lockedMap[bucket].items.find((lockedPerk) => lockedPerk.hash === perk.plugItem.hash)
              )
            ).length;
          }) -
          sum(a.armor, (item) => {
            if (!item || !item.sockets) {
              return 0;
            }
            return item.sockets.sockets.filter((slot) =>
              slot.plugOptions.find((perk) =>
                lockedMap[bucket].items.find((lockedPerk) => lockedPerk.hash === perk.plugItem.hash)
              )
            ).length;
          })
        );
      });
    }
  });

  return matchedSets;
}
