import { stripAdept } from 'app/compare/compare-buttons';
import { tl } from 'app/i18next-t';
import { TagValue } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { isArtifice } from 'app/item-triage/triage-utils';
import { StatsSet } from 'app/loadout-builder/process-worker/stats-set';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { chainComparator, compareBy, reverseComparator } from '../../utils/comparators';
import { DEFAULT_SHADER, armorStats } from '../d2-known-values';
import { FilterDefinition } from '../filter-types';

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
    item.tier
  }${
    // The engram that dispenses the Taraxippos scout rifle is also called Taraxippos
    item.type
  }`;

const sortDupes = (
  dupes: {
    [dupeID: string]: DimItem[];
  },
  getTag: (item: DimItem) => TagValue | undefined
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
      compareBy((i) => i.id) // tiebreak by ID
    )
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

const dupeFilters: FilterDefinition[] = [
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
        (i) => i.hash.toString()
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
    filter: ({ allItems }) => {
      const duplicates = computeStatDupeLower(allItems);
      return (item) => item.bucket.inArmor && duplicates.has(item.id);
    },
  },
  {
    keywords: 'customstatlower',
    description: tl('Filter.CustomStatLower'),
    filter: ({ allItems, customStats }) => {
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
          computeStatDupeLower(allItems, relevantStatHashes)
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
];

export default dupeFilters;

export function checkIfIsDupe(
  duplicates: {
    [dupeID: string]: DimItem[];
  },
  dupeId: string,
  item: DimItem
) {
  return (
    duplicates[dupeId]?.length > 1 &&
    item.hash !== DEFAULT_SHADER &&
    item.bucket.hash !== BucketHashes.SeasonalArtifact
  );
}

function computeStatDupeLower(allItems: DimItem[], relevantStatHashes: number[] = armorStats) {
  // disregard no-class armor
  const armor = allItems.filter((i) => i.bucket.inArmor && i.classType !== DestinyClass.Classified);

  // Group by class and armor type. Also, compare exotics with each other, not the general pool.
  const grouped = Object.values(
    Object.groupBy(armor, (i) => `${i.bucket.hash}-${i.classType}-${i.isExotic ? i.hash : ''}`)
  );

  const dupes = new Set<string>();

  // A mapping from an item to a list of all of its stat configurations
  // (Artifice armor can have multiple). This is just a cache to prevent
  // recalculating it.
  const statsCache = new Map<DimItem, number[][]>();
  for (const item of armor) {
    if (item.stats && item.power && item.bucket.hash !== BucketHashes.ClassArmor) {
      const statValues = item.stats
        .filter((s) => relevantStatHashes.includes(s.statHash))
        .sort((a, b) => a.statHash - b.statHash)
        .map((s) => s.base);
      if (isArtifice(item)) {
        statsCache.set(
          item,
          // Artifice armor can be +3 in any one stat, so we compute a separate
          // version of the stats for each stat considered
          relevantStatHashes.map((_s, i) => {
            const modifiedStats = [...statValues];
            // One stat gets +3
            modifiedStats[i] += 3;
            return modifiedStats;
          })
        );
      } else {
        statsCache.set(item, [statValues]);
      }
    }
  }

  // For each group of items that should be compared against each other
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
