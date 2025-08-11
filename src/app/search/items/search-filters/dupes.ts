import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { stripAdept } from 'app/compare/compare-utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { tl } from 'app/i18next-t';
import { TagValue } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { calculateAssumedMasterworkStats } from 'app/loadout-drawer/loadout-utils';
import { DEFAULT_SHADER, armorStats } from 'app/search/d2-known-values';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { getArmor3TuningStat, isArtifice } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { ItemFilterDefinition } from '../item-filter-types';
import { PerksSet } from './perks-set';
import { StatsSet } from './stats-set';

const notableTags = ['favorite', 'keep'];

/** outputs a string combination of the identifying features of an item, or the hash if classified */
export const makeDupeID = (item: DimItem) =>
  (item.classified && `${item.hash}`) ||
  `${
    // Consider adept versions of weapons to be the same as the normal type
    item.bucket.inWeapons ? stripAdept(item.name) : item.name
  }${
    // Some items have the same name across different classes, e.g. "Kairos Function Boots"
    item.classType
  }${
    // Some items have the same name across different tiers, e.g. "Traveler's Chosen"
    item.rarity
  }${
    // The engram that dispenses the Taraxippos scout rifle is also called Taraxippos
    item.bucket.hash
  }`;

const sortDupes = (
  dupes: {
    [dupeID: string]: DimItem[];
  },
  getTag: (item: DimItem) => TagValue | undefined,
) => {
  // The comparator for sorting dupes - the first item will be the "best" and all others are "dupelower".
  const dupeComparator = reverseComparator(
    chainComparator<DimItem>(
      // primary stat
      compareBy((item) => item.power),
      compareBy((item) => {
        const tag = getTag(item);
        return Boolean(tag && notableTags.includes(tag));
      }),
      compareBy((item) => item.masterwork),
      compareBy((item) => item.locked),
      compareBy((i) => i.id), // tiebreak by ID
    ),
  );

  for (const dupeList of Object.values(dupes)) {
    if (dupeList.length > 1) {
      dupeList.sort(dupeComparator);
    }
  }

  return dupes;
};

const computeDupesByIdFn = (allItems: DimItem[], makeDupeIdFn: (item: DimItem) => string) => {
  // Holds a map from item hash to count of occurrences of that hash
  const duplicates: { [dupeID: string]: DimItem[] } = {};

  for (const i of allItems) {
    if (!i.comparable) {
      continue;
    }
    const dupeID = makeDupeIdFn(i);
    if (!duplicates[dupeID]) {
      duplicates[dupeID] = [];
    }
    duplicates[dupeID].push(i);
  }

  return duplicates;
};

/**
 * Find a map of duplicate items using the makeDupeID function.
 */
export const computeDupes = (allItems: DimItem[]) => computeDupesByIdFn(allItems, makeDupeID);

const dupeFilters: ItemFilterDefinition[] = [
  {
    keywords: 'dupe',
    description: tl('Filter.Dupe'),
    filter: ({ allItems }) => {
      const duplicates = computeDupes(allItems);
      return (item) => {
        const dupeId = makeDupeID(item);
        return checkIfIsDupe(duplicates, dupeId, item);
      };
    },
  },
  {
    keywords: 'dupelower',
    description: tl('Filter.DupeLower'),
    filter: ({ allItems, getTag }) => {
      const duplicates = sortDupes(computeDupes(allItems), getTag);
      return (item) => {
        if (
          !(
            item.bucket &&
            (item.bucket.sort === 'Weapons' || item.bucket.sort === 'Armor') &&
            !item.notransfer
          )
        ) {
          return false;
        }

        const dupeId = makeDupeID(item);
        const dupes = duplicates[dupeId];
        if (dupes?.length > 1) {
          const bestDupe = dupes[0];
          return item !== bestDupe;
        }

        return false;
      };
    },
  },
  {
    keywords: 'infusionfodder',
    description: tl('Filter.InfusionFodder'),
    destinyVersion: 2,
    filter: ({ allItems }) => {
      const duplicates = computeDupesByIdFn(
        allItems.filter((i) => i.infusionFuel),
        (i) => i.hash.toString(),
      );
      return (item) => {
        if (!item.infusionFuel) {
          return false;
        }

        return duplicates[item.hash.toString()]?.some((i) => i.power < item.power);
      };
    },
  },
  {
    keywords: 'count',
    description: tl('Filter.DupeCount'),
    format: 'range',
    filter: ({ compare, allItems }) => {
      const duplicates = computeDupes(allItems);
      return (item) => {
        const dupeId = makeDupeID(item);
        return compare!(duplicates[dupeId]?.length ?? 0);
      };
    },
  },
  {
    keywords: 'statlower',
    description: tl('Filter.StatLower'),
    filter: ({ allItems, d2Definitions }) => {
      const duplicates = computeStatDupeLower(allItems, d2Definitions);
      return (item) => item.bucket.inArmor && duplicates.has(item.id);
    },
  },
  {
    keywords: 'customstatlower',
    description: tl('Filter.CustomStatLower'),
    filter: ({ allItems, customStats, d2Definitions }) => {
      const duplicateSetsByClass: Partial<Record<DimItem['classType'], Set<string>[]>> = {};

      for (const customStat of customStats) {
        const relevantStatHashes: number[] = [];
        const statWeights = customStat.weights;
        for (const statHash in statWeights) {
          const weight = statWeights[statHash];
          if (weight && weight > 0) {
            relevantStatHashes.push(parseInt(statHash, 10));
          }
        }
        (duplicateSetsByClass[customStat.class] ||= []).push(
          computeStatDupeLower(allItems, d2Definitions, relevantStatHashes),
        );
      }

      return (item) =>
        item.bucket.inArmor &&
        // highlight the item if it's statlower for all class-relevant custom stats.
        // this duplicates existing behavior for old style default-named custom stat,
        // but should be extended to also be a stat name-based filter
        // for users with multiple stats per class, a la customstatlower:pve
        duplicateSetsByClass[item.classType]?.every((dupeSet) => dupeSet.has(item.id));
    },
  },
  {
    keywords: ['crafteddupe', 'shapeddupe'],
    description: tl('Filter.CraftedDupe'),
    filter: ({ allItems }) => {
      const duplicates = computeDupes(allItems);
      return (item) => {
        const dupeId = makeDupeID(item);
        if (!checkIfIsDupe(duplicates, dupeId, item)) {
          return false;
        }
        const itemDupes = duplicates?.[dupeId];
        return itemDupes?.some((d) => d.crafted);
      };
    },
  },
  {
    keywords: ['dupeperks'],
    description: tl('Filter.DupePerks'),
    filter: ({ allItems }) => {
      const duplicates = new Map<string, PerksSet>();
      function getDupeId(item: DimItem) {
        // Don't compare across buckets or across types (e.g. Titan armor vs Hunter armor)
        return `${item.bucket.hash}|${item.classType}`;
      }
      for (const i of allItems) {
        if (i.sockets?.allSockets.some((s) => s.isPerk && s.socketDefinition.defaultVisible)) {
          const dupeId = getDupeId(i);
          if (!duplicates.has(dupeId)) {
            duplicates.set(dupeId, new PerksSet());
          }
          duplicates.get(dupeId)!.insert(i);
        }
      }
      return (item) =>
        item.sockets?.allSockets.some((s) => s.isPerk && s.socketDefinition.defaultVisible) &&
        Boolean(duplicates.get(getDupeId(item))?.hasPerkDupes(item));
    },
  },
];

export default dupeFilters;

export function checkIfIsDupe(
  duplicates: {
    [dupeID: string]: DimItem[];
  },
  dupeId: string,
  item: DimItem,
) {
  return (
    duplicates[dupeId]?.length > 1 &&
    item.hash !== DEFAULT_SHADER &&
    item.bucket.hash !== BucketHashes.SeasonalArtifact
  );
}

/**
 * Compute a set of items that are "stat lower" dupes. These are items for which
 * there exists another item with strictly better stats (i.e. better in at least
 * one stat and not worse in any stat).
 */
export function computeStatDupeLower(
  allItems: DimItem[],
  defs: D2ManifestDefinitions | undefined,
  relevantStatHashes: number[] = armorStats,
  getArmorStats?: (item: DimItem) => number[],
) {
  // disregard no-class armor
  const armor = allItems.filter((i) => i.bucket.inArmor && i.classType !== DestinyClass.Classified);

  const getStats =
    getArmorStats ??
    ((item: DimItem) => {
      // Always compare items as if they were fully masterworked
      const masterworkedStatValues = calculateAssumedMasterworkStats(item, {
        assumeArmorMasterwork: AssumeArmorMasterwork.All,
        minItemEnergy: 1,
      });
      return relevantStatHashes.map((statHash) => masterworkedStatValues[statHash] ?? 0);
    });

  // A mapping from an item to a list of all of its stat configurations
  // (Artifice armor can have multiple). This is just a cache to prevent
  // recalculating it.
  const statsCache = new Map<DimItem, number[][]>();
  for (const item of armor) {
    if (item.stats && item.power) {
      const statValues = getStats(item);
      let statMixes = [statValues];

      // Add in tuning mod variations if applicable
      const tuningStat = defs ? getArmor3TuningStat(item, defs) : undefined;
      if (tuningStat) {
        const tuningStatIndex = relevantStatHashes.indexOf(tuningStat);
        if (tuningStatIndex >= 0) {
          // Get the indexes of the three lowest stats, which will be boosted by the tuning mod
          // to +1. This assumes that the first stat values in statValues are armor stats
          // in the same order as relevantStatHashes.
          const worstThreeStatIndexes = [
            ...statValues.splice(0, relevantStatHashes.length).entries(),
          ]
            .sort((a, b) => a[1] - b[1])
            .splice(0, 3)
            .map((e) => e[0]);
          statMixes = relevantStatHashes.map((statHash, i) => {
            const modifiedStats = [...statValues];
            for (let vi = 0; vi < relevantStatHashes.length; vi++) {
              const v = statValues[vi];
              if (statHash === tuningStat) {
                // Apply the balanced tuning mod which gives +1 to the three zero-base stats.
                modifiedStats[vi] = worstThreeStatIndexes.includes(vi) ? v + 1 : v;
              } else {
                // Apply the tuning mod that sacrifices one stat for +5 to the
                // tuning stat. We always boost the tuning stat, but each other
                // stat is boosted only if it is the one being sacrificed
                modifiedStats[vi] = vi === tuningStatIndex ? v + 5 : vi === i ? v - 5 : v;
              }
            }
            return modifiedStats;
          });
        }
      } else if (isArtifice(item)) {
        // We assume armor cannot be both artifice and tunable.
        statMixes =
          // Artifice armor can be +3 in any one stat, so we compute a separate
          // version of the stats for each stat considered
          relevantStatHashes.map((_s, i) => {
            const modifiedStats = [...statValues];
            // One stat gets +3
            modifiedStats[i] += 3;
            return modifiedStats;
          });
      }
      statsCache.set(item, statMixes);
    }
  }

  const dupes = new Set<string>();

  // Group by class and armor type. Also, compare exotics with each other, not the general pool.
  const grouped = Object.values(
    Object.groupBy(armor, (i) => `${i.bucket.hash}-${i.classType}-${i.isExotic ? i.hash : ''}`),
  );
  for (const group of grouped) {
    const statSet = new StatsSet<DimItem>();
    // Add a mapping from stats => item to the statsSet for each item in the group
    for (const item of group) {
      const stats = statsCache.get(item);
      if (stats) {
        for (const statValues of stats) {
          statSet.insert(statValues, item);
        }
      }
    }

    // Now run through the items in the group again, checking against the fully
    // populated stats set to see if there's something better
    for (const item of group) {
      const stats = statsCache.get(item);
      // All configurations must have a better version somewhere for this to count as statlower
      if (stats?.every((statValues) => statSet.doBetterStatsExist(statValues))) {
        dupes.add(item.id);
      }
    }
  }

  return dupes;
}
