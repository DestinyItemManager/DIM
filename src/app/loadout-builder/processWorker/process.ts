import _ from 'lodash';
import { DimItem } from '../../inventory/item-types';
import {
  LockableBuckets,
  ArmorSet,
  StatTypes,
  LockedItemType,
  ItemsByBucket,
  LockedMap,
  LockedArmor2Mod,
  LockedArmor2ModMap,
} from '../types';
import { statTier } from '../generated-sets/utils';
import { reportException } from 'app/utils/exceptions';
import { compareBy } from 'app/utils/comparators';
import { Armor2ModPlugCategories } from 'app/utils/item-utils';
import { statKeys, statHashes, generateMixesFromPerksOrStats } from '../utils';

/**
 * This processes all permutations of armor to build sets
 * @param filteredItems pared down list of items to process sets from
 */
export function process(
  filteredItems: ItemsByBucket,
  lockedItems: LockedMap,
  lockedArmor2ModMap: LockedArmor2ModMap,
  selectedStoreId: string,
  assumeMasterwork: boolean
): { sets: ArmorSet[]; combos: number; combosWithoutCaps: number } {
  const pstart = performance.now();

  // Memoize the function that turns string stat-keys back into numbers to save garbage.
  // Writing our own memoization instead of using _.memoize is 2x faster.
  const keyToStatsCache = new Map<string, number[]>();
  const keyToStats = (key: string) => {
    let value = keyToStatsCache.get(key);
    if (value) {
      return value;
    }
    value = JSON.parse(key) as number[];
    keyToStatsCache.set(key, value);
    return value;
  };

  const helms = multiGroupBy(
    _.sortBy(
      filteredItems[LockableBuckets.helmet] || [],
      (i) => -i.basePower,
      (i) => !i.equipped
    ),
    byStatMix(
      assumeMasterwork,
      lockedItems[LockableBuckets.helmet],
      lockedArmor2ModMap[Armor2ModPlugCategories.helmet]
    )
  );
  const gaunts = multiGroupBy(
    _.sortBy(
      filteredItems[LockableBuckets.gauntlets] || [],
      (i) => -i.basePower,
      (i) => !i.equipped
    ),
    byStatMix(
      assumeMasterwork,
      lockedItems[LockableBuckets.gauntlets],
      lockedArmor2ModMap[Armor2ModPlugCategories.gauntlets]
    )
  );
  const chests = multiGroupBy(
    _.sortBy(
      filteredItems[LockableBuckets.chest] || [],
      (i) => -i.basePower,
      (i) => !i.equipped
    ),
    byStatMix(
      assumeMasterwork,
      lockedItems[LockableBuckets.chest],
      lockedArmor2ModMap[Armor2ModPlugCategories.chest]
    )
  );
  const legs = multiGroupBy(
    _.sortBy(
      filteredItems[LockableBuckets.leg] || [],
      (i) => -i.basePower,
      (i) => !i.equipped
    ),
    byStatMix(
      assumeMasterwork,
      lockedItems[LockableBuckets.leg],
      lockedArmor2ModMap[Armor2ModPlugCategories.leg]
    )
  );
  const classitems = multiGroupBy(
    _.sortBy(
      filteredItems[LockableBuckets.classitem] || [],
      (i) => -i.basePower,
      (i) => !i.equipped
    ),
    byStatMix(
      assumeMasterwork,
      lockedItems[LockableBuckets.classitem],
      lockedArmor2ModMap[Armor2ModPlugCategories.classitem]
    )
  );

  // Ghosts don't have power, so sort them with exotics first
  const ghosts = multiGroupBy(
    _.sortBy(
      filteredItems[LockableBuckets.ghost] || [],
      (i) => !(i.owner === selectedStoreId && i.equipped)
    ),
    byStatMix(assumeMasterwork, lockedItems[LockableBuckets.ghost])
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
      combos: existingTask,
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
              const armor = [
                helms[helmsKey],
                gaunts[gauntsKey],
                chests[chestsKey],
                legs[legsKey],
                classitems[classItemsKey],
                ghosts[ghostsKey],
              ];

              const firstValidSet = getFirstValidSet(armor);
              if (firstValidSet) {
                const statChoices = [
                  keyToStats(helmsKey),
                  keyToStats(gauntsKey),
                  keyToStats(chestsKey),
                  keyToStats(legsKey),
                  keyToStats(classItemsKey),
                  keyToStats(ghostsKey),
                ];

                const maxPower = getPower(firstValidSet);

                const stats = {};
                for (const stat of statChoices) {
                  let index = 0;
                  for (const key of statKeys) {
                    stats[key] = Math.min((stats[key] || 0) + stat[index], 100);
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

                const existingSetAtTier = groupedSets[tiers];
                if (existingSetAtTier) {
                  existingSetAtTier.sets.push({
                    armor,
                    statChoices,
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
                        statChoices,
                      },
                    ],
                    stats: stats as {
                      [statType in StatTypes]: number;
                    },
                    // TODO: defer calculating first valid set / statchoices / maxpower?
                    firstValidSet,
                    firstValidSetStatChoices: statChoices,
                    maxPower,
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

const emptyStats = [JSON.stringify(new Array(_.size(statHashes)).fill(0))];

/**
 * Generate all possible stat mixes this item can contribute from different perk options,
 * expressed as comma-separated strings in the same order as statHashes.
 */
function byStatMix(
  assumeMasterwork: boolean,
  lockedItems?: readonly LockedItemType[],
  lockedArmor2Mods?: LockedArmor2Mod[]
) {
  const lockedModStats: { [statHash: number]: number } = {};
  // Handle old armour mods
  if (lockedItems) {
    for (const lockedItem of lockedItems) {
      if (lockedItem.type === 'mod') {
        for (const stat of lockedItem.mod.investmentStats) {
          lockedModStats[stat.statTypeHash] = lockedModStats[stat.statTypeHash] || 0;
          lockedModStats[stat.statTypeHash] += stat.value;
        }
      }
    }
  }

  // Handle armour 2.0 mods
  if (lockedArmor2Mods) {
    for (const lockedMod of lockedArmor2Mods) {
      for (const stat of lockedMod.mod.investmentStats) {
        lockedModStats[stat.statTypeHash] = lockedModStats[stat.statTypeHash] || 0;
        lockedModStats[stat.statTypeHash] += stat.value;
      }
    }
  }

  return (item: DimItem): string[] => {
    const stats = item.stats;

    if (!stats || stats.length < 3) {
      return emptyStats;
    }

    const mixes: number[][] = generateMixesFromPerksOrStats(item, assumeMasterwork, lockedModStats);

    if (mixes.length === 1) {
      return mixes.map((m) => JSON.stringify(m));
    }
    return _.uniq(mixes.map((m) => JSON.stringify(m)));
  };
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
