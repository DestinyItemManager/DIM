import _, { Dictionary } from 'lodash';
import idx from 'idx';
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
import { reportException } from 'app/utils/exceptions';
import { compareBy } from 'app/utils/comparators';
import { DimStat } from 'app/inventory/item-types';
import { getMasterworkSocketHashes } from '../utils/plug-utils';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';

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
      const highTierItems = filteredItems[bucket].filter(
        (item) =>
          (item && item.isDestiny2() && ['Exotic', 'Legendary'].includes(item.tier)) ||
          // If it's a locked item, always let it through
          (locked && locked.some((l) => l.type === 'item' && l.item.id === item.id))
      );

      if (highTierItems.length > 0) {
        filteredItems[bucket] = highTierItems;
      }
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
export function process(
  filteredItems: ItemsByBucket
): { sets: ArmorSet[]; combos: number; combosWithoutCaps: number } {
  const pstart = performance.now();

  const emptyStats = _.mapValues(statHashes, () => 0);

  // Memoize the function that turns string stat-keys back into numbers to save garbage.
  // Writing our own memoization instead of using _.memoize is 2x faster.
  const keyToStatsCache = new Map<string, number[]>();
  const keyToStats = (key: string) => {
    let value = keyToStatsCache.get(key);
    if (value) {
      return value;
    }
    value = key.split(',').map((val) => parseInt(val, 10));
    keyToStatsCache.set(key, value);
    return value;
  };

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
  // Ghosts don't have power, so sort them with exotics first
  const ghosts = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.ghost] || [], (i) => !i.isExotic),
    byStatMix
  );

  // We won't search through more than this number of stat combos - it can cause us to run out of memory.
  const combosLimit = 500000;

  // Get the keys of the object, sorted by total stats descending
  const makeKeys = (obj: { [key: string]: DimItem[] }) =>
    _.sortBy(Object.keys(obj), (k) => -1 * _.sum(keyToStats(k)));

  const helmsKeys = makeKeys(helms);
  const gauntsKeys = makeKeys(gaunts);
  const chestsKeys = makeKeys(chests);
  const legsKeys = makeKeys(legs);
  const classItemsKeys = makeKeys(classitems);
  const ghostsKeys = makeKeys(ghosts);

  const combosWithoutCaps =
    helmsKeys.length *
    gauntsKeys.length *
    chestsKeys.length *
    legsKeys.length *
    classItemsKeys.length *
    ghostsKeys.length;

  let combos = combosWithoutCaps;

  // If we're over the limit, start trimming down the armor lists starting with the longest.
  // Since we're already sorted by total stats descending this should toss the worst items.
  while (combos > combosLimit) {
    const longestList = _.maxBy([helmsKeys, gauntsKeys, chestsKeys, legsKeys], (l) => l.length);
    longestList!.pop();
    combos =
      helmsKeys.length *
      gauntsKeys.length *
      chestsKeys.length *
      legsKeys.length *
      classItemsKeys.length *
      ghostsKeys.length;
  }

  if (combos < combosWithoutCaps) {
    console.log('Reduced armor combinations from', combosWithoutCaps, 'to', combos);
  }

  // We use a marker in local storage to detect when LO crashes during processing (usually due to using too much memory).
  const existingTask = localStorage.getItem('loadout-optimizer');
  if (existingTask && existingTask !== '0') {
    console.error(
      'Loadout Optimizer probably crashed last time while processing',
      existingTask,
      'combinations'
    );
    reportException('Loadout Optimizer', new Error('Loadout Optimizer crash while processing'), {
      combos: existingTask
    });
  }
  localStorage.setItem('loadout-optimizer', combos.toString());

  if (combos === 0) {
    return { sets: [], combos: 0, combosWithoutCaps: 0 };
  }

  type Mutable<T> = { -readonly [P in keyof T]: T[P] };
  const groupedSets: { [tiers: string]: Mutable<ArmorSet> } = {};

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
                keyToStats(helmsKey),
                keyToStats(gauntsKey),
                keyToStats(chestsKey),
                keyToStats(legsKey),
                keyToStats(classItemsKey),
                keyToStats(ghostsKey)
              ];
              if (firstValidSet) {
                const maxPower = getPower(firstValidSet);
                for (const stat of statChoices) {
                  let index = 0;
                  for (const key of statKeys) {
                    stats[key] += stat[index];
                    index++;
                  }
                }

                // A string version of the tier-level of each stat, separated by commas
                // This is an awkward implementation to save garbage allocations.
                let tiers = '';
                let index = 1;
                for (const statKey in stats) {
                  tiers += statTier(stats[statKey]);
                  if (index < statKeys.length) {
                    tiers += ',';
                  }
                  index++;
                }
                /*
                const tiers = Object.values(stats)
                  .map(statTier)
                  .join(',');
                  */

                const existingSetAtTier = groupedSets[tiers];
                if (existingSetAtTier) {
                  existingSetAtTier.sets.push({
                    armor,
                    statChoices
                  });
                  if (maxPower > existingSetAtTier.maxPower) {
                    existingSetAtTier.firstValidSet = firstValidSet;
                    existingSetAtTier.maxPower = maxPower;
                    existingSetAtTier.firstValidSetStatChoices = statChoices;
                  }
                } else {
                  // First of its kind
                  groupedSets[tiers] = {
                    sets: [
                      {
                        armor,
                        statChoices
                      }
                    ],
                    stats,
                    // TODO: defer calculating first valid set / statchoices / maxpower?
                    firstValidSet,
                    firstValidSetStatChoices: statChoices,
                    maxPower
                  };
                }
              }
            }
          }
        }
      }
    }
  }

  const finalSets = Object.values(groupedSets);

  console.log(
    'found',
    finalSets.length,
    'stat mixes after processing',
    combos,
    'stat combinations in',
    performance.now() - pstart,
    'ms'
  );

  localStorage.removeItem('loadout-optimizer');

  return { sets: finalSets, combos, combosWithoutCaps };
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
  const mixes: number[][] = [getBaseStatValues(statsByHash, item)];

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

function getBaseStatValues(stats: Dictionary<DimStat>, item: DimItem) {
  const baseStats = {};

  for (const statHash of statValues) {
    baseStats[statHash] = stats[statHash].value;
  }

  // Checking energy tells us if it is Armour 2.0
  if (item.isDestiny2() && item.sockets && item.energy) {
    const masterworkSocketHashes = getMasterworkSocketHashes(
      item.sockets,
      DestinySocketCategoryStyle.EnergyMeter
    );

    for (const socket of item.sockets.sockets) {
      const plugHash = idx(socket, (socket) => socket.plug.plugItem.hash) || null;

      if (socket.plug && socket.plug.stats && !masterworkSocketHashes.includes(plugHash)) {
        for (const statHash of statValues) {
          if (socket.plug.stats[statHash]) {
            baseStats[statHash] -= socket.plug.stats[statHash];
          }
        }
      }
    }
  }
  // mapping out from stat values to ensure ordering
  return statValues.map((statHash) => baseStats[statHash]);
}

/**
 * Get the loadout permutation for this stat mix that has the highest power, assuming the
 * items in each slot are already sorted by power. This respects the rule that two exotics
 * cannot be equipped at once.
 */
function getFirstValidSet(armors: readonly DimItem[][]) {
  const exoticIndices: number[] = [];
  let index = 0;
  for (const armor of armors) {
    if (armor[0].equippingLabel) {
      exoticIndices.push(index);
    }
    index++;
  }

  if (exoticIndices.length > 1) {
    exoticIndices.sort(compareBy((i) => armors[i][0].basePower));
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
  let power = 0;
  let numPoweredItems = 0;
  for (const item of items) {
    if (item.basePower) {
      power += item.basePower;
      numPoweredItems++;
    }
  }

  return Math.floor(power / numPoweredItems);
}
