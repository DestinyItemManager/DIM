import { t } from 'i18next';
import * as _ from 'underscore';
import { sum } from '../../util';
import { ArmorSet, LockType } from '../types';

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
  setMap: ArmorSet[],
  lockedMap: { [bucketHash: number]: LockType },
  tier: string
): ArmorSet[] {
  const matchedSets: ArmorSet[] = [];
  let count = 0;

  Object.values(setMap).forEach((set) => {
    if (count > 10) {
      return;
    }

    if (set.tiers.includes(tier)) {
      matchedSets.push(set);
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
              slot.plugOptions.some((perk) =>
                lockedMap[bucket].items.find((lockedPerk) => lockedPerk.hash === perk.plugItem.hash)
              )
            ).length;
          }) -
          sum(a.armor, (item) => {
            if (!item || !item.sockets) {
              return 0;
            }
            return item.sockets.sockets.filter((slot) =>
              slot.plugOptions.some((perk) =>
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

/**
 * Build the dropdown options for a collection of armorSets
 */
export function getSetTiers(armorSets: ArmorSet[]): string[] {
  const tiersSet = new Set<string>();
  armorSets.forEach((set: ArmorSet) => {
    set.tiers.forEach((tier: string) => {
      tiersSet.add(tier);
    });
  });

  const tiers = _.each(
    _.groupBy(Array.from(tiersSet.keys()), (tierString: string) => {
      return sum(tierString.split('/'), (num) => parseInt(num, 10));
    }),
    (tier) => {
      tier.sort().reverse();
    }
  );

  const tierKeys = Object.keys(tiers);
  const setTiers: string[] = [];
  for (let tier = tierKeys.length; tier > tierKeys.length - 3; tier--) {
    if (tierKeys[tier]) {
      setTiers.push(t('LoadoutBuilder.SelectTierHeader', { tier: tierKeys[tier] }));
      tiers[tierKeys[tier]].forEach((set) => {
        setTiers.push(set);
      });
    }
  }

  return setTiers;
}
