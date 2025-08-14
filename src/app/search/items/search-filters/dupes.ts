import { stripAdept } from 'app/compare/compare-utils';
import { tl } from 'app/i18next-t';
import { TagValue } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { DEFAULT_SHADER, TOTAL_STAT_HASH, armorStats } from 'app/search/d2-known-values';
import { filterMap } from 'app/utils/collections';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { getArmor3TuningStat, isArtifice } from 'app/utils/item-utils';
import { computeStatDupeLower } from 'app/utils/stats';
import { BucketHashes } from 'data/d2/generated-enums';
import { ItemFilterDefinition } from '../item-filter-types';
import { PerksSet } from './perks-set';

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
          computeStatDupeLower(allItems, relevantStatHashes),
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
  {
    keywords: ['statdupe'],
    description: tl('Filter.DupeStats'),
    destinyVersion: 2,
    filter: ({ allItems }) => {
      const collector: Record<string, string[]> = {};
      for (const item of allItems) {
        if (
          // This filter is for armor with stats
          !item.bucket.inArmor ||
          !item.stats ||
          // Special cases for class items
          (item.bucket.hash === BucketHashes.ClassArmor &&
            // Older class items have no stats.
            (item.stats.find((s) => s.statHash === TOTAL_STAT_HASH)?.base === 0 ||
              // Exotic class items all have identical stats.
              item.rarity === 'Exotic'))
        ) {
          continue;
        }

        // *Stat-related* reasons an item's stats might not be directly comparable to another item's.
        const statExceptionKey = isArtifice(item) ? 'artifice' : getArmor3TuningStat(item);

        const statValues = filterMap(item.stats, (s) => {
          if (armorStats.includes(s.statHash)) {
            return s.base;
          }
        });
        const key = `${statExceptionKey}|${item.classType}|${item.bucket.name}|${statValues.join()}`;
        (collector[key] ??= []).push(item.id);
      }

      const dupes = new Set<string>();
      for (const key in collector) {
        const items = collector[key];
        if (items.length > 1) {
          for (const id of items) {
            dupes.add(id);
          }
        }
      }

      return (item) => dupes.has(item.id);
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
