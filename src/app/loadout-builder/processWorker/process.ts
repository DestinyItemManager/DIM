import _ from 'lodash';
import { LockableBuckets, StatTypes, MinMaxIgnored, MinMax } from '../types';
import { statTier } from '../utils';
import { statHashes } from '../types';
import {
  ProcessItemsByBucket,
  ProcessItem,
  ProcessArmorSet,
  IntermediateProcessArmorSet,
  LockedArmor2ProcessMods,
  ProcessMod,
} from './types';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import {
  canTakeAllSeasonalMods,
  sortProcessModsOrProcessItems,
  canTakeAllGeneralMods,
} from './processUtils';
import { armor2PlugCategoryHashesByName, TOTAL_STAT_HASH } from '../../search/d2-known-values';

const RETURNED_ARMOR_SETS = 200;

type SetTracker = {
  tier: number;
  statMixes: { statMix: string; armorSets: IntermediateProcessArmorSet[] }[];
}[];

function insertIntoSetTracker(
  tier: number,
  statMix: string,
  armorSet: IntermediateProcessArmorSet,
  setTracker: SetTracker
): void {
  if (setTracker.length === 0) {
    setTracker.push({ tier, statMixes: [{ statMix, armorSets: [armorSet] }] });
    return;
  }

  for (let tierIndex = 0; tierIndex < setTracker.length; tierIndex++) {
    const currentTier = setTracker[tierIndex];

    if (tier > currentTier.tier) {
      setTracker.splice(tierIndex, 0, { tier, statMixes: [{ statMix, armorSets: [armorSet] }] });
      return;
    }

    if (tier === currentTier.tier) {
      const currentStatMixes = currentTier.statMixes;

      for (let statMixIndex = 0; statMixIndex < currentStatMixes.length; statMixIndex++) {
        const currentStatMix = currentStatMixes[statMixIndex];

        if (statMix > currentStatMix.statMix) {
          currentStatMixes.splice(statMixIndex, 0, { statMix, armorSets: [armorSet] });
          return;
        }

        if (currentStatMix.statMix === statMix) {
          for (
            let armorSetIndex = 0;
            armorSetIndex < currentStatMix.armorSets.length;
            armorSetIndex++
          ) {
            if (armorSet.maxPower > currentStatMix.armorSets[armorSetIndex].maxPower) {
              currentStatMix.armorSets.splice(armorSetIndex, 0, armorSet);
            } else {
              currentStatMix.armorSets.push(armorSet);
            }
            return;
          }
        }

        if (statMixIndex === currentStatMixes.length - 1) {
          currentStatMixes.push({ statMix, armorSets: [armorSet] });
          return;
        }
      }
    }

    if (tierIndex === setTracker.length - 1) {
      setTracker.push({ tier, statMixes: [{ statMix, armorSets: [armorSet] }] });
      return;
    }
  }
}

/**
 * This processes all permutations of armor to build sets
 * @param filteredItems pared down list of items to process sets from
 * @param modStatTotals Stats that are applied to final stat totals, think general and seasonal mod stats
 */
export function process(
  filteredItems: ProcessItemsByBucket,
  processedSeasonalMods: ProcessMod[],
  modStatTotals: { [stat in StatTypes]: number },
  lockedArmor2ModMap: LockedArmor2ProcessMods,
  assumeMasterwork: boolean,
  statOrder: StatTypes[],
  statFilters: { [stat in StatTypes]: MinMaxIgnored },
  minimumPower: number
): {
  sets: ProcessArmorSet[];
  combos: number;
  combosWithoutCaps: number;
  statRanges?: { [stat in StatTypes]: MinMax };
} {
  const pstart = performance.now();

  processedSeasonalMods.sort(sortProcessModsOrProcessItems);

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

  const helms = _.sortBy(
    filteredItems[LockableBuckets.helmet] || [],
    (i) => -i.baseStats[TOTAL_STAT_HASH]
  );
  const gaunts = _.sortBy(
    filteredItems[LockableBuckets.gauntlets] || [],
    (i) => -i.baseStats[TOTAL_STAT_HASH]
  );
  const chests = _.sortBy(
    filteredItems[LockableBuckets.chest] || [],
    (i) => -i.baseStats[TOTAL_STAT_HASH]
  );
  const legs = _.sortBy(
    filteredItems[LockableBuckets.leg] || [],
    (i) => -i.baseStats[TOTAL_STAT_HASH]
  );
  const classItems = _.sortBy(
    filteredItems[LockableBuckets.classitem] || [],
    (i) => -i.baseStats[TOTAL_STAT_HASH]
  );

  // We won't search through more than this number of stat combos - it can cause us to run out of memory.
  const combosLimit = 2_000_000;

  const combosWithoutCaps =
    helms.length * gaunts.length * chests.length * legs.length * classItems.length;

  let combos = combosWithoutCaps;

  // If we're over the limit, start trimming down the armor lists starting with the longest.
  // Since we're already sorted by total stats descending this should toss the worst items.
  while (combos > combosLimit) {
    const lowestTotalStat = _.minBy(
      [helms, gaunts, chests, legs],
      (l) => l[l.length - 1].baseStats[TOTAL_STAT_HASH]
    );
    lowestTotalStat!.pop();
    combos = helms.length * gaunts.length * chests.length * legs.length * classItems.length;
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

  const statsCache: Record<string, number[]> = {};

  for (const item of [...helms, ...gaunts, ...chests, ...legs, ...classItems]) {
    statsCache[item.id] = getStatMix(item, assumeMasterwork, orderedStatValues);
  }

  for (const helm of helms) {
    for (const gaunt of gaunts) {
      for (const chest of chests) {
        for (const leg of legs) {
          for (const classItem of classItems) {
            const armor = [helm, gaunt, chest, leg, classItem];

            // Make sure there is at most one exotic
            if (_.sumBy(armor, (item) => (item.equippingLabel ? 1 : 0)) <= 1) {
              const statChoices = [
                statsCache[helm.id],
                statsCache[gaunt.id],
                statsCache[chest.id],
                statsCache[leg.id],
                statsCache[classItem.id],
              ];

              const maxPower = getPower(armor);

              if (maxPower < minimumPower) {
                continue;
              }

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
                stats[statKey] += modStatTotals[statKey];
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

              // Reset the used item energy of each item so we can add general and seasonal mod costs again.
              for (const item of armor) {
                if (item.energy) {
                  item.energy.val = item.energy.valInitial;
                }
              }

              // For armour 2 mods we ignore slot specific mods as we prefilter items based on energy requirements.
              // For mod armour 2 mods we do seasonal first as its more likely to have energy specific mods.
              // TODO Check validity of this with the energy contraints in.
              if (
                (processedSeasonalMods.length &&
                  !canTakeAllSeasonalMods(processedSeasonalMods, armor)) ||
                (lockedArmor2ModMap.seasonal.length &&
                  !canTakeAllSeasonalMods(lockedArmor2ModMap.seasonal, armor)) ||
                (lockedArmor2ModMap[armor2PlugCategoryHashesByName.general].length &&
                  !canTakeAllGeneralMods(
                    lockedArmor2ModMap[armor2PlugCategoryHashesByName.general],
                    armor
                  ))
              ) {
                continue;
              }

              const newArmorSet: IntermediateProcessArmorSet = {
                armor,
                stats: stats as {
                  [statType in StatTypes]: number;
                },
                statChoices,
                maxPower,
              };

              insertIntoSetTracker(totalTier, tiers, newArmorSet, setTracker);

              setCount++;

              if (setCount > RETURNED_ARMOR_SETS) {
                const lowestTierSet = setTracker[setTracker.length - 1];
                const worstMix = lowestTierSet.statMixes[lowestTierSet.statMixes.length - 1];

                worstMix.armorSets.pop();
                setCount--;

                if (worstMix.armorSets.length === 0) {
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

  const finalSets = setTracker.map((set) => set.statMixes.map((mix) => mix.armorSets)).flat(2);

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

const emptyStats: number[] = new Array(_.size(statHashes)).fill(0);

/**
 * Generate all possible stat mixes this item can contribute from different perk options,
 * expressed as comma-separated strings in the same order as statHashes.
 */
function getStatMix(item: ProcessItem, assumeMasterwork: boolean, orderedStatValues: number[]) {
  const stats = item.stats;

  if (!stats) {
    return emptyStats;
  }

  const mixes: number[][] = [getStatValuesWithMWProcess(item, assumeMasterwork, orderedStatValues)];

  if (stats && item.sockets && item.energy) {
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

  if (mixes.length === 1) {
    return mixes[0];
  }
  // return the mix with the higest total stat
  return _.sortBy((mix) => _.sum(mix))[0];
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

/**
 * Gets the stat values of an item with masterwork.
 */
function getStatValuesWithMWProcess(
  item: ProcessItem,
  assumeMasterwork: boolean | null,
  orderedStatValues: number[]
) {
  const baseStats = { ...item.baseStats };

  // Checking energy tells us if it is Armour 2.0 (it can have value 0)
  if (item.sockets && item.energy) {
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

    if (masterworkSocketHashes.length) {
      for (const socket of item.sockets.sockets) {
        const plugHash = socket?.plug?.plugItemHash ?? NaN;

        if (socket.plug?.stats && masterworkSocketHashes.includes(plugHash)) {
          for (const statHash of orderedStatValues) {
            if (socket.plug.stats[statHash]) {
              baseStats[statHash] += socket.plug.stats[statHash];
            }
          }
        }
      }
    }

    if (assumeMasterwork) {
      for (const statHash of orderedStatValues) {
        baseStats[statHash] += 2;
      }
    }
  }
  // mapping out from stat values to ensure ordering and that values don't fall below 0 from locked mods
  return orderedStatValues.map((statHash) => Math.max(baseStats[statHash], 0));
}

function flattenSets(sets: IntermediateProcessArmorSet[]): ProcessArmorSet[] {
  return sets.map((set) => ({
    ...set,
    armor: set.armor.map((item) => item.id),
  }));
}
