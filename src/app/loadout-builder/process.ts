import _ from 'lodash';
import { DimItem, DimPlug } from '../inventory/item-types';
import {
  LockableBuckets,
  ArmorSet,
  StatTypes,
  LockedItemType,
  ItemsByBucket,
  LockedMap
} from './types';
import { statTier } from './generated-sets/utils';
import { DimStat } from 'app/inventory/item-types';

export const statHashes: { [type in StatTypes]: number } = {
  Mobility: 2996146975,
  Resilience: 392767087,
  Recovery: 1943323491,
  Discipline: 1735777505,
  Intellect: 144602215,
  Strength: 4244567218
};
export const statValues = Object.values(statHashes);
export const statKeys = Object.keys(statHashes) as StatTypes[];

/**
 * Filter the items map down given the locking and filtering configs.
 */
export function filterItems(
  items: ItemsByBucket,
  requirePerks: boolean,
  lockedMap: LockedMap,
  filter: (item: DimItem) => boolean
): ItemsByBucket {
  const filteredItems: { [bucket: number]: readonly DimItem[] } = {};

  Object.keys(items).forEach((bucketStr) => {
    const bucket = parseInt(bucketStr, 10);
    const locked = lockedMap[bucket];

    // if we are locking an item in that bucket, filter to only include that single item
    if (locked && locked.length) {
      const lockedItem = locked[0];
      if (lockedItem.type === 'item') {
        filteredItems[bucket] = [lockedItem.item];
        return;
      }
    }

    // otherwise flatten all item instances to each bucket
    filteredItems[bucket] = items[bucket].filter(filter);
    if (!filteredItems[bucket].length) {
      // If nothing matches, just include everything so we can make valid sets
      filteredItems[bucket] = items[bucket];
    }

    // filter out low-tier items and items without extra perks on them
    if (requirePerks) {
      filteredItems[bucket] = filteredItems[bucket].filter(
        (item) => item && item.isDestiny2() && ['Exotic', 'Legendary'].includes(item.tier)
      );
    }
  });

  // filter to only include items that are in the locked map
  Object.keys(lockedMap).forEach((bucketStr) => {
    const bucket = parseInt(bucketStr, 10);
    const locked = lockedMap[bucket];
    // if there are locked items for this bucket
    if (locked && locked.length && filteredItems[bucket]) {
      filteredItems[bucket] = filteredItems[bucket].filter((item) =>
        locked.every((lockedItem) => matchLockedItem(item, lockedItem))
      );
    }
  });

  return filteredItems;
}

function matchLockedItem(item: DimItem, lockedItem: LockedItemType) {
  switch (lockedItem.type) {
    case 'exclude':
      return item.id !== lockedItem.item.id;
    case 'burn':
      return item.dmg === lockedItem.burn.dmg;
    case 'perk':
      return (
        item.isDestiny2() &&
        item.sockets &&
        item.sockets.sockets.some((slot) =>
          slot.plugOptions.some((plug) => lockedItem.perk.hash === plug.plugItem.hash)
        )
      );
    case 'item':
      return item.id === lockedItem.item.id;
  }
}

/**
 * This processes all permutations of armor to build sets
 * @param filteredItems pared down list of items to process sets from
 */
export function process(filteredItems: ItemsByBucket): ArmorSet[] {
  const pstart = performance.now();
  const helms = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.helmet] || [], (i) => -i.basePower),
    byStatMix
  );
  const gaunts = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.gauntlets] || [], (i) => -i.basePower),
    byStatMix
  );
  const chests = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.chest] || [], (i) => -i.basePower),
    byStatMix
  );
  const legs = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.leg] || [], (i) => -i.basePower),
    byStatMix
  );
  const classitems = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.classitem] || [], (i) => -i.basePower),
    byStatMix
  );
  const ghosts = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.ghost] || [], (i) => !i.isExotic),
    byStatMix
  );
  const setMap: ArmorSet[] = [];

  const helmsKeys = Object.keys(helms);
  const gauntsKeys = Object.keys(gaunts);
  const chestsKeys = Object.keys(chests);
  const legsKeys = Object.keys(legs);
  const classItemsKeys = Object.keys(classitems);
  const ghostsKeys = Object.keys(ghosts);

  const combos =
    helmsKeys.length *
    gauntsKeys.length *
    chestsKeys.length *
    legsKeys.length *
    classItemsKeys.length *
    ghostsKeys.length;

  if (combos === 0) {
    return [];
  }

  const emptyStats = _.mapValues(statHashes, () => 0);

  for (const helmsKey of helmsKeys) {
    for (const gauntsKey of gauntsKeys) {
      for (const chestsKey of chestsKeys) {
        for (const legsKey of legsKeys) {
          for (const classItemsKey of classItemsKeys) {
            for (const ghostsKey of ghostsKeys) {
              const stats: { [statType in StatTypes]: number } = { ...emptyStats };

              const armor = [
                helms[helmsKey],
                gaunts[gauntsKey],
                chests[chestsKey],
                legs[legsKey],
                classitems[classItemsKey],
                ghosts[ghostsKey]
              ];

              const firstValidSet = getFirstValidSet(armor);
              const statChoices = [
                helmsKey,
                gauntsKey,
                chestsKey,
                legsKey,
                classItemsKey,
                ghostsKey
              ].map((key) => key.split(',').map((val) => parseInt(val, 10)));
              if (firstValidSet) {
                const set: ArmorSet = {
                  sets: [
                    {
                      armor,
                      statChoices
                    }
                  ],
                  stats,
                  firstValidSet,
                  firstValidSetStatChoices: statChoices,
                  maxPower: getPower(firstValidSet)
                };

                for (const stat of set.sets[0].statChoices) {
                  let index = 0;
                  for (const key of statKeys) {
                    stats[key] += stat[index];
                    index++;
                  }
                }

                setMap.push(set);
              }
            }
          }
        }
      }
    }
  }

  const groupedSets = _.groupBy(setMap, (set) =>
    Object.values(set.stats)
      .map(statTier)
      .join(',')
  );

  type Mutable<T> = { -readonly [P in keyof T]: T[P] };

  const finalSets = Object.values(groupedSets).map((sets) => {
    const combinedSet = sets.shift()! as Mutable<ArmorSet>;
    for (const set of sets) {
      const armorSet = set.sets[0];
      combinedSet.sets.push(armorSet);
      if (set.maxPower > combinedSet.maxPower) {
        combinedSet.firstValidSet = set.firstValidSet;
        combinedSet.maxPower = set.maxPower;
        combinedSet.firstValidSetStatChoices = set.firstValidSetStatChoices;
      }
    }
    return combinedSet;
  });

  console.log(
    'found',
    finalSets.length,
    'stat mixes after processing',
    combos,
    'stat combinations in',
    performance.now() - pstart,
    'ms'
  );

  return finalSets;
}

function multiGroupBy<T>(items: T[], mapper: (item: T) => string[]) {
  const map: { [key: string]: T[] } = {};
  for (const item of items) {
    for (const result of mapper(item)) {
      map[result] = map[result] || [];
      map[result].push(item);
    }
  }
  return map;
}

const emptyStats = [new Array(_.size(statHashes)).fill(0).toString()];

/**
 * Generate all possible stat mixes this item can contribute from different perk options,
 * expressed as comma-separated strings in the same order as statHashes.
 */
function byStatMix(item: DimItem): string[] {
  const stats = item.stats;

  if (!stats || stats.length < 3) {
    return emptyStats;
  }

  const mixes: number[][] = generateMixesFromPerks(item);

  if (mixes.length === 1) {
    return mixes.map((m) => m.toString());
  }
  return _.uniq(mixes.map((m) => m.toString()));
}

/**
 * This is the awkward helper used by both byStatMix (to generate the list of stat mixes) and
 * GeneratedSetItem#identifyAltPerkChoicesForChosenStats, which figures out which perks need
 * to be selected to get that stat mix. It has two modes depending on whether an "onMix" callback
 * is provided - if it is, it assumes we're looking for perks, not mixes, and keeps track of
 * what perks are necessary to fulfill a stat-mix, and lets the callback stop the function early.
 * If not, it just returns all the mixes. This is like this so we can share this complicated
 * bit of logic and not get it out of sync.
 */
export function generateMixesFromPerks(
  item: DimItem,
  /** Callback when a new mix is found. */
  onMix?: (mix: number[], plug: DimPlug[] | null) => boolean
) {
  const stats = item.stats;

  if (!stats || stats.length < 3) {
    return [];
  }

  const statsByHash = _.keyBy(stats, (stat) => stat.statHash);
  const mixes: number[][] = [
    statValues.map((statHash) => getBaseStatValue(statsByHash[statHash], item))
  ];

  const altPerks: (DimPlug[] | null)[] = [null];

  if (stats && item.isDestiny2() && item.sockets) {
    for (const socket of item.sockets.sockets) {
      if (socket.plugOptions.length > 1) {
        for (const plug of socket.plugOptions) {
          if (plug !== socket.plug && plug.stats) {
            // Stats without the currently selected plug, with the optional plug
            const mixNum = mixes.length;
            for (let mixIndex = 0; mixIndex < mixNum; mixIndex++) {
              const existingMix = mixes[mixIndex];
              const optionStat = statValues.map((statHash, index) => {
                const currentPlugValue =
                  (socket.plug && socket.plug.stats && socket.plug.stats[statHash]) || 0;
                const optionPlugValue = (plug.stats && plug.stats[statHash]) || 0;
                return existingMix[index] - currentPlugValue + optionPlugValue;
              });

              if (onMix) {
                const existingMixAlts = altPerks[mixIndex];
                const plugs = existingMixAlts ? [...existingMixAlts, plug] : [plug];
                altPerks.push(plugs);
                if (!onMix(optionStat, plugs)) {
                  return [];
                }
              }
              mixes.push(optionStat);
            }
          }
        }
      }
    }
  }

  return mixes;
}

function getBaseStatValue(stat: DimStat, item: DimItem) {
  let baseStatValue = stat.value;

  // Checking energy tells us if it is Armour 2.0
  if (item.isDestiny2() && item.sockets && item.energy) {
    for (const socket of item.sockets.sockets) {
      if (socket.plug && socket.plug.plugItem.investmentStats) {
        for (const plugStat of socket.plug.plugItem.investmentStats) {
          if (plugStat.statTypeHash === stat.statHash) {
            const useablePlugStatValue = plugStat.value || 0;
            // This is additive in event that more than one mod is stacking
            baseStatValue -= useablePlugStatValue;
          }
        }
      }
    }
  }

  return baseStatValue;
}

/**
 * Get the loadout permutation for this stat mix that has the highest power, assuming the
 * items in each slot are already sorted by power. This respects the rule that two exotics
 * cannot be equipped at once.
 */
function getFirstValidSet(armors: readonly DimItem[][]) {
  let exoticIndices: number[] = [];
  let index = 0;
  for (const armor of armors) {
    if (armor[0].equippingLabel) {
      exoticIndices.push(index);
    }
    index++;
  }

  if (exoticIndices.length > 1) {
    exoticIndices = _.sortBy(exoticIndices, (i) => armors[i][0].basePower);
    for (let numExotics = exoticIndices.length; numExotics > 0; numExotics--) {
      // Start by trying to substitute the least powerful exotic
      const fixedIndex = exoticIndices.shift()!;
      // For each remaining exotic, try to find a non-exotic in its place
      const firstValid = armors.map((a, i) =>
        exoticIndices.includes(i) ? a.find((item) => !item.equippingLabel) : a[0]
      );
      // If we found something for every slot
      if (firstValid.every(Boolean)) {
        return _.compact(firstValid);
      }
      // Put it back on the end
      exoticIndices.push(fixedIndex);
    }
    return undefined;
  } else {
    return armors.map((a) => a[0]);
  }
}

/**
 * Get the maximum average power for a particular set of armor.
 */
function getPower(items: DimItem[]) {
  // Ghosts don't count!
  return Math.floor(_.sumBy(items, (i) => i.basePower) / (items.length - 1));
}
