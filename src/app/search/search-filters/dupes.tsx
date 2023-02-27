import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { tl } from 'app/i18next-t';
import { getTag, ItemInfos } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { getSeason } from 'app/inventory/store/season';
import { isArtifice } from 'app/item-triage/triage-utils';
import { StatsSet } from 'app/loadout-builder/process-worker/stats-set';
import { Settings } from 'app/settings/initial-settings';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { chainComparator, compareBy, reverseComparator } from '../../utils/comparators';
import { armorStats, DEFAULT_SHADER } from '../d2-known-values';
import { FilterDefinition } from '../filter-types';

const notableTags = ['favorite', 'keep'];

/** outputs a string combination of the identifying features of an item, or the hash if classified */
export const makeDupeID = (item: DimItem) =>
  (item.classified && `${item.hash}`) ||
  `${item.name}${item.classType}${item.tier}${item.itemCategoryHashes.join('.')}`;

// so, duplicate detection has gotten complicated in season 8. same items can have different hashes.
// we use enough values to ensure this item is intended to be the same, as the index for looking up dupes
const makeSeasonalDupeID = (item: DimItem) =>
  (item.classified && `${item.hash}`) ||
  `${item.name}${item.classType}${item.tier}item.collectibleHash}${item.powerCap}${getSeason(
    item
  )}${item.itemCategoryHashes.join('.')}`;

const sortDupes = (
  dupes: {
    [dupeID: string]: DimItem[];
  },
  itemInfos: ItemInfos,
  itemHashTags?: {
    [itemHash: string]: ItemHashTag;
  }
) => {
  // The comparator for sorting dupes - the first item will be the "best" and all others are "dupelower".
  const dupeComparator = reverseComparator(
    chainComparator<DimItem>(
      // primary stat
      compareBy((item) => item.power),
      compareBy((item) => item.masterwork),
      compareBy((item) => item.locked),
      compareBy((item) => {
        const tag = getTag(item, itemInfos, itemHashTags);
        return Boolean(tag && notableTags.includes(tag));
      }),
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
    const dupeID = makeDupeIdFn(i);
    if (!duplicates[dupeID]) {
      duplicates[dupeID] = [];
    }
    duplicates[dupeID].push(i);
  }

  return duplicates;
};

/**
 * A memoized function to find a map of duplicate items using the makeDupeID function.
 */
export const computeDupes = (allItems: DimItem[]) => computeDupesByIdFn(allItems, makeDupeID);

/**
 * A memoized function to find a map of duplicate items using the makeSeasonalDupeID function.
 */
const computeSeasonalDupes = (allItems: DimItem[]) =>
  computeDupesByIdFn(allItems, makeSeasonalDupeID);

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
    keywords: 'seasonaldupe',
    description: tl('Filter.SeasonalDupe'),
    destinyVersion: 2,
    filter: ({ allItems }) => {
      const duplicates = computeSeasonalDupes(allItems);
      return (item) => {
        const dupeId = makeSeasonalDupeID(item);
        return checkIfIsDupe(duplicates, dupeId, item);
      };
    },
  },
  {
    keywords: 'dupelower',
    description: tl('Filter.DupeLower'),
    filter: ({ allItems, itemInfos, itemHashTags }) => {
      const duplicates = sortDupes(computeDupes(allItems), itemInfos, itemHashTags);
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
      const duplicates = computeStatDupeLower(allItems, customStats);
      return (item) => item.bucket.inArmor && duplicates.has(item.id);
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

function computeStatDupeLower(
  allItems: DimItem[],
  customStats: Settings['customTotalStatsByClass'] = {}
) {
  // disregard no-class armor
  const armor = allItems.filter((i) => i.bucket.inArmor && i.classType !== -1);

  // Group by class and armor type. Also, compare exotics with each other, not the general pool.
  const grouped = Object.values(
    _.groupBy(armor, (i) => `${i.bucket.hash}-${i.classType}-${i.isExotic ? i.hash : ''}`)
  );

  const statsCache = new Map<DimItem, number[]>();
  const dupes = new Set<string>();

  // Run through all the armor once to get their stats, so we don't have to
  // compute item => stats more than once
  for (const item of armor) {
    if (item.stats && item.power && item.bucket.hash !== BucketHashes.ClassArmor) {
      const statsToConsider = customStats[item.classType] ?? armorStats;
      statsCache.set(
        item,
        item.stats
          .filter((s) => statsToConsider.includes(s.statHash))
          .sort((a, b) => a.statHash - b.statHash)
          .map((s) => s.base)
      );
    }
  }

  // For each group of items that should be compared against each other
  for (const group of grouped) {
    const statSet = new StatsSet<DimItem>();
    // Add a mapping from stats => item to the statsSet for each item in the group
    for (const item of group) {
      const stats = statsCache.get(item);
      if (stats) {
        if (isArtifice(item)) {
          // Artifice armor can be +3 in any one stat, so we insert a separate
          // version of the stats for each stat considered
          const statsToConsider = customStats[item.classType] ?? armorStats;
          for (let i = 0; i < statsToConsider.length; i++) {
            const modifiedStats = [...stats];
            // One stat gets +3
            modifiedStats[i] += 3;
            statSet.insert(modifiedStats, item);
          }
        } else {
          statSet.insert(stats, item);
        }
      }
    }

    // Now run through the items in the group again, checking against the fully
    // populated stats set to see if there's something better
    for (const item of group) {
      const stats = statsCache.get(item);
      if (stats && statSet.doBetterStatsExist(stats)) {
        dupes.add(item.id);
      }
    }
  }

  return dupes;
}
