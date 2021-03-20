import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { armor2PlugCategoryHashesByName, TOTAL_STAT_HASH } from '../../search/d2-known-values';
import { infoLog } from '../../utils/log';
import {
  knownModPlugCategoryHashes,
  LockableBuckets,
  MinMax,
  MinMaxIgnored,
  raidPlugCategoryHashes,
  statHashes,
  StatTypes,
} from '../types';
import { getPower, statTier } from '../utils';
import { canTakeSlotIndependantMods, generateModPermutations } from './processUtils';
import {
  IntermediateProcessArmorSet,
  LockedProcessMods,
  ProcessArmorSet,
  ProcessItem,
  ProcessItemsByBucket,
  ProcessMod,
} from './types';

/** Caps the maximum number of total armor sets that'll be returned */
const RETURNED_ARMOR_SETS = 200;

/**
 * A list of stat mixes by total tier. We can keep this list up to date
 * as we process new sets with an insertion sort algorithm.
 */
type SetTracker = {
  tier: number;
  statMixes: { statMix: string; armorSets: IntermediateProcessArmorSet[] }[];
}[];

/**
 * Use an insertion sort algorithm to keep an ordered list of sets first by total tier, then by stat mix within a tier.
 * This takes advantage of the fact that strings are lexically comparable, but maybe it does that badly...
 */
// TODO: replace with trie?
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
            if (
              getPower(armorSet.armor) > getPower(currentStatMix.armorSets[armorSetIndex].armor)
            ) {
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
 * @param modStatTotals Stats that are applied to final stat totals, think general and other mod stats
 */
export function process(
  filteredItems: ProcessItemsByBucket,
  /** No idea what this is */
  /** Selected mods' total contribution to each stat */
  // TODO: use stat hash, or order
  modStatTotals: { [stat in StatTypes]: number },
  /** Mods to add onto the sets */
  lockedModMap: LockedProcessMods,
  assumeMasterwork: boolean,
  // TODO: replace with stat hashes
  statOrder: StatTypes[],
  // TODO: maps, eradicate stat types
  statFilters: { [stat in StatTypes]: MinMaxIgnored }
): {
  sets: ProcessArmorSet[];
  combos: number;
  combosWithoutCaps: number;
  statRanges?: { [stat in StatTypes]: MinMax };
} {
  const pstart = performance.now();

  const orderedStatHashes = statOrder.map((statType) => statHashes[statType]);
  // Stat types excluding ignored stats
  const orderedConsideredStats = statOrder.filter((statType) => !statFilters[statType].ignored);

  // This stores the computed min and max value for each stat as we process all sets, so we
  // can display it on the stat filter dropdowns
  const statRanges: { [stat in StatTypes]: MinMax } = {
    Mobility: statFilters.Mobility.ignored ? { min: 0, max: 10 } : { min: 10, max: 0 },
    Resilience: statFilters.Resilience.ignored ? { min: 0, max: 10 } : { min: 10, max: 0 },
    Recovery: statFilters.Recovery.ignored ? { min: 0, max: 10 } : { min: 10, max: 0 },
    Discipline: statFilters.Discipline.ignored ? { min: 0, max: 10 } : { min: 10, max: 0 },
    Intellect: statFilters.Intellect.ignored ? { min: 0, max: 10 } : { min: 10, max: 0 },
    Strength: statFilters.Strength.ignored ? { min: 0, max: 10 } : { min: 10, max: 0 },
  };

  // Sort gear by total stat (descending) so we consider the best gear first
  // TODO: make these a list/map
  // TODO: we should precompute the stats first, and then sort on total, so we can incoporate the masterworkiness
  // TODO: sort by total taking into account ignored stats!
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
  // TODO: we used to do these in chunks, where items w/ same stats were considered together. For class items that
  // might still be useful. In practice there are only 1/2 class items you need to care about - all of them that are
  // masterworked and all of them that aren't.
  // TODO: test this hypothesis by counting by unique stat?
  const classItems = _.sortBy(
    filteredItems[LockableBuckets.classitem] || [],
    (i) => -i.baseStats[TOTAL_STAT_HASH]
  );

  // We won't search through more than this number of stat combos - it can cause us to run out of memory.
  const combosLimit = 2_000_000;

  // The maximum possible combos we could have
  const combosWithoutCaps =
    helms.length * gaunts.length * chests.length * legs.length * classItems.length;

  let combos = combosWithoutCaps;

  // If we're over the limit, start trimming down the armor lists starting with the longest.
  // Since we're already sorted by total stats descending this should toss the worst items.
  // TODO: this should also be post adjusted stats
  while (combos > combosLimit) {
    const lowestTotalStat = _.minBy(
      [helms, gaunts, chests, legs],
      (l) => l[l.length - 1].baseStats[TOTAL_STAT_HASH]
    );
    lowestTotalStat!.pop();
    combos = helms.length * gaunts.length * chests.length * legs.length * classItems.length;
  }

  if (combos < combosWithoutCaps) {
    infoLog(
      'loadout optimizer',
      'Reduced armor combinations from',
      combosWithoutCaps,
      'to',
      combos
    );
  }

  if (combos === 0) {
    return { sets: [], combos: 0, combosWithoutCaps: 0 };
  }

  const setTracker: SetTracker = [];

  let lowestTier = 100;
  let setCount = 0;

  // TODO: Map?
  // TODO: this could be a map from item object to stat!
  const statsCache: Record<string, number[]> = {};

  // Precompute the stats of each item in the order the user asked for
  for (const item of [...helms, ...gaunts, ...chests, ...legs, ...classItems]) {
    statsCache[item.id] = getStatValuesWithMWProcess(item, assumeMasterwork, orderedStatHashes);
  }

  // TODO: not sure what this is all about
  // TODO: preprocess all this stuff? It doesn't change as often...
  let generalMods: ProcessMod[] = [];
  let otherMods: ProcessMod[] = [];
  let raidMods: ProcessMod[] = [];

  for (const [plugCategoryHash, mods] of Object.entries(lockedModMap)) {
    const pch = Number(plugCategoryHash);
    if (pch === armor2PlugCategoryHashesByName.general) {
      generalMods = generalMods.concat(mods);
    } else if (raidPlugCategoryHashes.includes(pch)) {
      raidMods = raidMods.concat(mods);
    } else if (!knownModPlugCategoryHashes.includes(pch)) {
      otherMods = otherMods.concat(mods);
    }
  }

  const generalModsPermutations = generateModPermutations(generalMods);
  const otherModPermutations = generateModPermutations(otherMods);
  const raidModPermutations = generateModPermutations(raidMods);

  for (const helm of helms) {
    for (const gaunt of gaunts) {
      for (const chest of chests) {
        for (const leg of legs) {
          for (const classItem of classItems) {
            const numExotics =
              (helm.equippingLabel ? 1 : 0) +
              (gaunt.equippingLabel ? 1 : 0) +
              (chest.equippingLabel ? 1 : 0) +
              (leg.equippingLabel ? 1 : 0) +
              (classItem.equippingLabel ? 1 : 0);
            if (numExotics > 1) {
              continue;
            }

            const armor = [helm, gaunt, chest, leg, classItem];

            const statChoices = [
              statsCache[helm.id],
              statsCache[gaunt.id],
              statsCache[chest.id],
              statsCache[leg.id],
              statsCache[classItem.id],
            ];

            // TODO: why not just another ordered list?
            // TODO: reuse this object?
            const stats: { [statType in StatTypes]: number } = {
              Mobility: 0,
              Resilience: 0,
              Recovery: 0,
              Discipline: 0,
              Intellect: 0,
              Strength: 0,
            };
            for (const itemStats of statChoices) {
              let index = 0;
              // itemStats are already in the user's chosen stat order
              for (const statType of statOrder) {
                stats[statType] = stats[statType] + itemStats[index];
                index++;
              }
            }

            // A string version of the tier-level of each stat, separated by commas
            // This is an awkward implementation to save garbage allocations.
            let tiers = '';
            let totalTier = 0;
            let index = 0;
            let statRangeExceeded = false;
            for (const statKey of orderedConsideredStats) {
              // Stats can't exceed 100 even with mods. At least, today they
              // can't - we *could* pass the max value in from the stat def.
              stats[statKey] = Math.min(stats[statKey] + modStatTotals[statKey], 100);
              const tier = statTier(stats[statKey]);

              // Update our global min/max for this stat
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
              if (index < statOrder.length - 1) {
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

            // TODO: Perhaps do this as a post-filter
            // For armour 2 mods we ignore slot specific mods as we prefilter items based on energy requirements
            if (
              (otherMods.length || raidMods.length || generalMods.length) &&
              !canTakeSlotIndependantMods(
                generalModsPermutations,
                otherModPermutations,
                raidModPermutations,
                armor
              )
            ) {
              continue;
            }

            const newArmorSet: IntermediateProcessArmorSet = {
              armor,
              stats,
            };

            insertIntoSetTracker(totalTier, tiers, newArmorSet, setTracker);

            setCount++;

            // If we've gone over our max sets to return, drop the worst set
            // TODO: Could this remove good sets?
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

  const finalSets = setTracker.map((set) => set.statMixes.map((mix) => mix.armorSets)).flat(2);

  infoLog(
    'loadout optimizer',
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
    if (assumeMasterwork || item.energy) {
      // TODO: technically we could derive this from the available mods instead ("slot" them all)
      // Alternately we could make a lot more assumptions and just say if the energy capacity is 10, add 2 to every stat
      for (const statHash of orderedStatValues) {
        baseStats[statHash] += 2;
      }
    } else {
      // Armor masterworking is just filling up the energy meter
      const masterworkSocketCategory = item.sockets.categories.find(
        (category) => category.categoryStyle === DestinySocketCategoryStyle.EnergyMeter
      );

      const masterworkSocketHashes =
        masterworkSocketCategory?.sockets
          .map((socket) => socket.plug?.plugItemHash ?? NaN)
          .filter((val) => !isNaN(val)) ?? [];

      if (masterworkSocketHashes.length) {
        for (const socket of item.sockets.sockets) {
          const plugHash = socket.plug?.plugItemHash ?? NaN;

          if (socket.plug?.stats && masterworkSocketHashes.includes(plugHash)) {
            for (const statHash of orderedStatValues) {
              if (socket.plug.stats[statHash]) {
                baseStats[statHash] += socket.plug.stats[statHash];
              }
            }
          }
        }
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
