import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { tl } from 'app/i18next-t';
import { getTag, ItemInfos } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getSeason } from 'app/inventory/store/season';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { chainComparator, compareBy, reverseComparator } from '../../utils/comparators';
import { DEFAULT_SHADER } from '../d2-known-values';
import { FilterDefinition } from '../filter-types';
import { rangeStringToComparator } from './range-numeric';

const notableTags = ['favorite', 'keep'];

/** outputs a string combination of the identifying features of an item, or the hash if classified */
export const makeDupeID = (item: DimItem) =>
  (item.classified && `${item.hash}`) ||
  `${item.name}${item.classType}${item.tier}${item.itemCategoryHashes.join('.')}`;

// so, duplicate detection has gotten complicated in season 8. same items can have different hashes.
// we use enough values to ensure this item is intended to be the same, as the index for looking up dupes
export const makeSeasonalDupeID = (item: DimItem) =>
  (item.classified && `${item.hash}`) ||
  `${item.name}${item.classType}${item.tier}${
    item.isDestiny2() ? `${item.collectibleHash}${item.powerCap}${getSeason(item)}` : ''
  }${item.itemCategoryHashes.join('.')}`;

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
      compareBy((item) => item.primStat?.value),
      compareBy((item) => item.masterwork),
      compareBy((item) => item.locked),
      compareBy((item) => {
        const tag = getTag(item, itemInfos, itemHashTags);
        return Boolean(tag && notableTags.includes(tag));
      }),
      compareBy((i) => i.id) // tiebreak by ID
    )
  );

  _.forIn(dupes, (dupes) => {
    if (dupes.length > 1) {
      dupes.sort(dupeComparator);
    }
  });

  return dupes;
};

const computeDupesByIdFn = (stores: DimStore[], makeDupeIdFn: (item: DimItem) => string) => {
  // Holds a map from item hash to count of occurrances of that hash
  const duplicates: { [dupeID: string]: DimItem[] } = {};

  for (const store of stores) {
    for (const i of store.items) {
      const dupeID = makeDupeIdFn(i);
      if (!duplicates[dupeID]) {
        duplicates[dupeID] = [];
      }
      duplicates[dupeID].push(i);
    }
  }

  return duplicates;
};

/**
 * A memoized function to find a map of duplicate items using the makeDupeID function.
 */
export const computeDupes = (stores: DimStore[]) => computeDupesByIdFn(stores, makeDupeID);

/**
 * A memoized function to find a map of duplicate items using the makeSeasonalDupeID function.
 */
export const computeSeasonalDupes = (stores: DimStore[]) =>
  computeDupesByIdFn(stores, makeSeasonalDupeID);

const dupeFilters: FilterDefinition[] = [
  {
    keywords: 'dupe',
    description: tl('Filter.Dupe'),
    filter: ({ stores }) => {
      const duplicates = computeDupes(stores);
      return (item) => {
        const dupeId = makeDupeID(item);
        return checkIfIsDupe(duplicates, dupeId, item);
      };
    },
  },
  {
    keywords: 'seasonaldupe',
    description: tl('Filter.SeasonalDupe'),
    filter: ({ stores }) => {
      const duplicates = computeSeasonalDupes(stores);
      return (item) => {
        const dupeId = makeSeasonalDupeID(item);
        return checkIfIsDupe(duplicates, dupeId, item);
      };
    },
  },
  {
    keywords: 'dupelower',
    description: tl('Filter.DupeLower'),
    filter: ({ stores, itemInfos, itemHashTags }) => {
      const duplicates = sortDupes(computeDupes(stores), itemInfos, itemHashTags);
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
    keywords: 'count',
    description: tl('Filter.DupeCount'),
    format: 'range',
    filter: ({ stores, filterValue }) => {
      const compare = rangeStringToComparator(filterValue);
      const duplicates = computeDupes(stores);
      return (item) => {
        const dupeId = makeDupeID(item);
        return compare(duplicates[dupeId]?.length ?? 0);
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
    !item.itemCategoryHashes.includes(ItemCategoryHashes.ClanBanner) &&
    item.hash !== DEFAULT_SHADER &&
    item.bucket.hash !== BucketHashes.SeasonalArtifact
  );
}
