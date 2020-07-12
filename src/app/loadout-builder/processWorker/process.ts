import _ from 'lodash';
import {
  LockableBuckets,
  StatTypes,
  LockedItemType,
  LockedMap,
  LockedArmor2Mod,
  LockedArmor2ModMap,
  MinMaxIgnored,
  MinMax,
} from '../types';
import { statTier } from '../generated-sets/utils';
import { compareBy } from '../../utils/comparators';
import { Armor2ModPlugCategories } from '../../utils/item-utils';
import { statHashes } from '../types';
import {
  ProcessItemsByBucket,
  ProcessItem,
  ProcessArmorSet,
  IntermediateProcessArmorSet,
} from './types';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';

const RETURNED_ARMOR_SETS = 200;

type SetTracker = {
  tier: number;
  statMixes: { statMix: string; armorSet: IntermediateProcessArmorSet }[];
}[];

function insertIntoSetTracker(
  tier: number,
  statMix: string,
  armorSet: IntermediateProcessArmorSet,
  setTracker: SetTracker
): void {
  if (setTracker.length === 0) {
    setTracker.push({ tier, statMixes: [{ statMix, armorSet }] });
    return;
  }

  for (let tierIndex = 0; tierIndex < setTracker.length; tierIndex++) {
    const currentTier = setTracker[tierIndex];

    if (tier > currentTier.tier) {
      setTracker.splice(tierIndex, 0, { tier, statMixes: [{ statMix, armorSet }] });
      return;
    }

    if (tier === currentTier.tier) {
      const currentStatMixes = currentTier.statMixes;

      for (let statMixIndex = 0; statMixIndex < currentStatMixes.length; statMixIndex++) {
        const currentStatMix = currentStatMixes[statMixIndex];

        if (statMix > currentStatMix.statMix) {
          currentStatMixes.splice(statMixIndex, 0, { statMix, armorSet });
          return;
        }

        if (currentStatMix.statMix === statMix) {
          if (armorSet.maxPower > currentStatMix.armorSet.maxPower) {
            currentStatMix.armorSet.sets = armorSet.sets.concat(currentStatMix.armorSet.sets);
            currentStatMix.armorSet.firstValidSet = armorSet.firstValidSet;
            currentStatMix.armorSet.maxPower = armorSet.maxPower;
            currentStatMix.armorSet.firstValidSetStatChoices = armorSet.firstValidSetStatChoices;
          } else {
            currentStatMix.armorSet.sets = currentStatMix.armorSet.sets.concat(armorSet.sets);
          }
          return;
        }

        if (statMixIndex === currentStatMixes.length - 1) {
          currentStatMixes.push({ statMix, armorSet });
          return;
        }
      }
    }

    if (tierIndex === setTracker.length - 1) {
      setTracker.push({ tier, statMixes: [{ statMix, armorSet }] });
      return;
    }
  }
}

/**
 * This processes all permutations of armor to build sets
 * @param filteredItems pared down list of items to process sets from
 */
export function process(
  filteredItems: ProcessItemsByBucket,
  lockedItems: LockedMap,
  processedSeasonalMods: string[],
  lockedArmor2ModMap: LockedArmor2ModMap,
  assumeMasterwork: boolean,
  statOrder: StatTypes[],
  statFilters: { [stat in StatTypes]: MinMaxIgnored }
): {
  sets: ProcessArmorSet[];
  combos: number;
  combosWithoutCaps: number;
  statRanges?: { [stat in StatTypes]: MinMax };
} {
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

  const orderedStatValues = statOrder.map((statType) => statHashes[statType]);
  const orderedConsideredStats = statOrder.filter((statType) => !statFilters[statType].ignored);

  const statRanges: { [stat in StatTypes]: MinMax } = {
    Mobility: statFilters.Mobility.ignored ? { min: 0, max: 10 } : { min: 10, max: 0 },
    Resilience: statFilters.Resilience.ignored ? { min: 0, max: 10 } : { min: 10, max: 0 },
    Recovery: statFilters.Recovery.ignored ? { min: 0, max: 10 } : { min: 10, max: 0 },
    Discipline: statFilters.Discipline.ignored ? { min: 0, max: 10 } : { min: 10, max: 0 },
    Intellect: statFilters.Intellect.ignored ? { min: 0, max: 10 } : { min: 10, max: 0 },
    Strength: statFilters.Strength.ignored ? { min: 0, max: 10 } : { min: 10, max: 0 },
  };

  const helms = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.helmet] || [], (i) => -i.basePower),
    byStatMix(
      assumeMasterwork,
      orderedStatValues,
      lockedItems[LockableBuckets.helmet],
      lockedArmor2ModMap[Armor2ModPlugCategories.helmet]
    )
  );
  const gaunts = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.gauntlets] || [], (i) => -i.basePower),
    byStatMix(
      assumeMasterwork,
      orderedStatValues,
      lockedItems[LockableBuckets.gauntlets],
      lockedArmor2ModMap[Armor2ModPlugCategories.gauntlets]
    )
  );
  const chests = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.chest] || [], (i) => -i.basePower),
    byStatMix(
      assumeMasterwork,
      orderedStatValues,
      lockedItems[LockableBuckets.chest],
      lockedArmor2ModMap[Armor2ModPlugCategories.chest]
    )
  );
  const legs = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.leg] || [], (i) => -i.basePower),
    byStatMix(
      assumeMasterwork,
      orderedStatValues,
      lockedItems[LockableBuckets.leg],
      lockedArmor2ModMap[Armor2ModPlugCategories.leg]
    )
  );
  const classitems = multiGroupBy(
    _.sortBy(filteredItems[LockableBuckets.classitem] || [], (i) => -i.basePower),
    byStatMix(
      assumeMasterwork,
      orderedStatValues,
      lockedItems[LockableBuckets.classitem],
      lockedArmor2ModMap[Armor2ModPlugCategories.classitem]
    )
  );

  // We won't search through more than this number of stat combos - it can cause us to run out of memory.
  const combosLimit = 2_000_000;

  // Get the keys of the object, sorted by total stats descending
  const makeKeys = (obj: { [key: string]: ProcessItem[] }) =>
    _.sortBy(Object.keys(obj), (k) => -1 * _.sum(keyToStats(k)));

  const helmsKeys = makeKeys(helms);
  const gauntsKeys = makeKeys(gaunts);
  const chestsKeys = makeKeys(chests);
  const legsKeys = makeKeys(legs);
  const classItemsKeys = makeKeys(classitems);

  const combosWithoutCaps =
    helmsKeys.length *
    gauntsKeys.length *
    chestsKeys.length *
    legsKeys.length *
    classItemsKeys.length;

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
      classItemsKeys.length;
  }

  if (combos < combosWithoutCaps) {
    console.log('Reduced armor combinations from', combosWithoutCaps, 'to', combos);
  }

  if (combos === 0) {
    return { sets: [], combos: 0, combosWithoutCaps: 0 };
  }

  const setTracker: SetTracker = [];

  let lowestTier = 100;
  let setCount = 0;

  for (const helmsKey of helmsKeys) {
    for (const gauntsKey of gauntsKeys) {
      for (const chestsKey of chestsKeys) {
        for (const legsKey of legsKeys) {
          for (const classItemsKey of classItemsKeys) {
            const armor = [
              helms[helmsKey],
              gaunts[gauntsKey],
              chests[chestsKey],
              legs[legsKey],
              classitems[classItemsKey],
            ];

            const firstValidSet = getFirstValidSet(armor);
            if (firstValidSet) {
              const statChoices = [
                keyToStats(helmsKey),
                keyToStats(gauntsKey),
                keyToStats(chestsKey),
                keyToStats(legsKey),
                keyToStats(classItemsKey),
              ];

              const maxPower = getPower(firstValidSet);

              const stats: any = {};
              for (const stat of statChoices) {
                let index = 0;
                for (const key of statOrder) {
                  stats[key] = Math.min((stats[key] || 0) + stat[index], 100);
                  index++;
                }
              }

              // A string version of the tier-level of each stat, separated by commas
              // This is an awkward implementation to save garbage allocations.
              let tiers = '';
              let totalTier = 0;
              let index = 1;
              let statRangeExceeded = false;
              for (const statKey of orderedConsideredStats) {
                const tier = statTier(stats[statKey]);

                if (tier > statRanges[statKey].max) {
                  statRanges[statKey].max = tier;
                }

                if (tier < statRanges[statKey].min) {
                  statRanges[statKey].min = tier;
                }

                if (tier > statFilters[statKey].max || tier < statFilters[statKey].min) {
                  statRangeExceeded = true;
                  break;
                }
                tiers += tier;
                totalTier += tier;
                if (index < statOrder.length) {
                  tiers += ',';
                }
                index++;
              }

              if (statRangeExceeded) {
                continue;
              }

              // While we have less than RETURNED_ARMOR_SETS sets keep adding and keep track of the lowest total tier.
              if (totalTier < lowestTier) {
                if (setCount <= RETURNED_ARMOR_SETS) {
                  lowestTier = totalTier;
                } else {
                  continue;
                }
              }

              if (
                processedSeasonalMods.length &&
                !findUntilExhausted(processedSeasonalMods, firstValidSet)
              ) {
                continue;
              }

              const newArmorSet: IntermediateProcessArmorSet = {
                sets: [
                  {
                    armor,
                    statChoices,
                    maxPower,
                  },
                ],
                stats: stats as {
                  [statType in StatTypes]: number;
                },
                firstValidSet,
                firstValidSetStatChoices: statChoices,
                maxPower,
              };

              insertIntoSetTracker(totalTier, tiers, newArmorSet, setTracker);

              setCount++;

              if (setCount > RETURNED_ARMOR_SETS) {
                const lowestTierSet = setTracker[setTracker.length - 1];
                const worstMix = lowestTierSet.statMixes[lowestTierSet.statMixes.length - 1];

                worstMix.armorSet.sets.pop();
                setCount--;

                if (worstMix.armorSet.sets.length === 0) {
                  lowestTierSet.statMixes.pop();

                  if (lowestTierSet.statMixes.length === 0) {
                    setTracker.pop();
                    lowestTier = setTracker[setTracker.length - 1].tier;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  const finalSets = setTracker.map((set) => set.statMixes.map((mix) => mix.armorSet)).flat();

  console.log(
    'found',
    finalSets.length,
    'stat mixes after processing',
    combos,
    'stat combinations in',
    performance.now() - pstart,
    'ms'
  );

  return { sets: flattenSets(finalSets), combos, combosWithoutCaps, statRanges };
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
  orderedStatValues: number[],
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

  return (item: ProcessItem): string[] => {
    const stats = item.stats;

    if (!stats) {
      return emptyStats;
    }

    const mixes: number[][] = generateMixesFromPerksOrStats(
      item,
      assumeMasterwork,
      orderedStatValues,
      lockedModStats
    );

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
function getFirstValidSet(armors: readonly ProcessItem[][]) {
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
function getPower(items: ProcessItem[]) {
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

function generateMixesFromPerksOrStats(
  item: ProcessItem,
  assumeArmor2IsMasterwork: boolean | null,
  orderedStatValues: number[],
  lockedModStats: { [statHash: number]: number }
) {
  const stats = item.stats;

  if (!stats) {
    return [];
  }

  const mixes: number[][] = [
    getBaseStatValues(item, assumeArmor2IsMasterwork, orderedStatValues, lockedModStats),
  ];

  if (stats && item.sockets && item.energyType === undefined) {
    for (const socket of item.sockets.sockets) {
      if (socket.plugOptions.length > 1) {
        for (const plug of socket.plugOptions) {
          if (plug !== socket.plug && plug.stats) {
            // Stats without the currently selected plug, with the optional plug
            const mixNum = mixes.length;
            for (let mixIndex = 0; mixIndex < mixNum; mixIndex++) {
              const existingMix = mixes[mixIndex];
              const optionStat = orderedStatValues.map((statHash, index) => {
                const currentPlugValue = (socket.plug?.stats && socket.plug.stats[statHash]) ?? 0;
                const optionPlugValue = plug.stats?.[statHash] || 0;
                return existingMix[index] - currentPlugValue + optionPlugValue;
              });

              mixes.push(optionStat);
            }
          }
        }
      }
    }
  }

  return mixes;
}

function getBaseStatValues(
  item: ProcessItem,
  assumeMasterwork: boolean | null,
  orderedStatValues: number[],
  lockedModStats: { [statHash: number]: number }
) {
  const baseStats = {};

  for (const statHash of orderedStatValues) {
    baseStats[statHash] = item.stats[statHash];
  }

  // Checking energy tells us if it is Armour 2.0 (it can have value 0)
  if (item.sockets && item.energyType !== undefined) {
    let masterworkSocketHashes: number[] = [];

    // only get masterwork sockets if we aren't manually adding the values
    if (!assumeMasterwork) {
      const masterworkSocketCategory = item.sockets.categories.find(
        (category) => category.categoryStyle === DestinySocketCategoryStyle.EnergyMeter
      );

      if (masterworkSocketCategory) {
        masterworkSocketHashes = masterworkSocketCategory.sockets
          .map((socket) => socket?.plug?.plugItemHash ?? NaN)
          .filter((val) => !isNaN(val));
      }
    }

    for (const socket of item.sockets.sockets) {
      const plugHash = socket?.plug?.plugItemHash ?? NaN;

      if (socket.plug?.stats && !masterworkSocketHashes.includes(plugHash)) {
        for (const statHash of orderedStatValues) {
          if (socket.plug.stats[statHash]) {
            baseStats[statHash] -= socket.plug.stats[statHash];
          }
        }
      }
    }

    if (assumeMasterwork) {
      for (const statHash of orderedStatValues) {
        baseStats[statHash] += 2;
      }
    }
    // For Armor 2.0 mods, include the stat values of any locked mods in the item's stats
    _.forIn(lockedModStats, (value, statHash) => {
      baseStats[statHash] += value;
    });
  }
  // mapping out from stat values to ensure ordering and that values don't fall below 0 from locked mods
  return orderedStatValues.map((statHash) => Math.max(baseStats[statHash], 0));
}

function flattenSets(sets: IntermediateProcessArmorSet[]): ProcessArmorSet[] {
  return sets.map((set) => ({
    ...set,
    sets: set.sets.map((armorSet) => ({
      ...armorSet,
      armor: armorSet.armor.map((items) => items.map((item) => item.id)),
    })),
    firstValidSet: set.firstValidSet.map((item) => item.id),
  }));
}

function findUntilExhausted(sortedModSeasons: string[], items: ProcessItem[]) {
  const itemModSeasons = [...items]
    .sort((a, b) => {
      if (a.season && b.season) {
        return a.season - b.season;
      } else if (!a.season) {
        return 1;
      }
      return -1;
    })
    .map((item) => item.modSeasons);

  let modIndex = 0;
  let itemIndex = 0;

  while (modIndex < sortedModSeasons.length && itemIndex < items.length) {
    if (itemModSeasons[itemIndex]?.includes(sortedModSeasons[modIndex])) {
      modIndex += 1;
    }
    itemIndex += 1;
  }

  // This needs to be larger than the last index in the array as it will overshoot if they all fit.
  return modIndex === sortedModSeasons.length;
}
