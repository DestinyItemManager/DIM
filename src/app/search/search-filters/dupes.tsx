import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { tl } from 'app/i18next-t';
import { getTag, ItemInfos } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import memoizeOne from 'memoize-one';
import { chainComparator, compareBy, reverseComparator } from '../../utils/comparators';
import { DEFAULT_SHADER, SEASONAL_ARTIFACT_BUCKET } from '../d2-known-values';
import { FilterContext, FilterDefinition } from '../filter-types';
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
    item.isDestiny2() ? `${item.collectibleHash}${item.powerCap}` : ''
  }${item.itemCategoryHashes.join('.')}`;

const makeDupeComparator = (
  itemInfos: ItemInfos,
  itemHashTags?: {
    [itemHash: string]: ItemHashTag;
  }
) =>
  // The comparator for sorting dupes - the first item will be the "best" and all others are "dupelower".
  reverseComparator(
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
// TODO: this is a memory leak that keeps all stores around
export const computeDupes = memoizeOne((stores: DimStore[]) =>
  computeDupesByIdFn(stores, makeDupeID)
);

/**
 * A memoized function to find a map of duplicate items using the makeSeasonalDupeID function.
 */
// TODO: this is a memory leak that keeps all stores around
export const computeSeasonalDupes = memoizeOne((stores: DimStore[]) =>
  computeDupesByIdFn(stores, makeSeasonalDupeID)
);

const dupeFilters: FilterDefinition[] = [
  {
    keywords: ['dupe'],
    description: [tl('Filter.Dupe')],
    format: 'simple',
    filterFunction: (item: DimItem, _, { stores }: FilterContext) => {
      const duplicates = computeDupes(stores);
      const dupeId = makeDupeID(item);
      return checkIfIsDupe(duplicates, dupeId, item);
    },
  },
  {
    keywords: ['seasonaldupe'],
    description: [tl('Filter.SeasonalDupe')],
    format: 'simple',
    filterFunction: (item: DimItem, _, { stores }: FilterContext) => {
      const duplicates = computeSeasonalDupes(stores);
      const dupeId = makeSeasonalDupeID(item);
      return checkIfIsDupe(duplicates, dupeId, item);
    },
  },
  {
    keywords: ['dupelower'],
    description: [tl('Filter.Dupe')],
    format: 'simple',
    filterFunction: (item: DimItem, _, { stores, itemInfos, itemHashTags }: FilterContext) => {
      if (
        !(
          item.bucket &&
          (item.bucket.sort === 'Weapons' || item.bucket.sort === 'Armor') &&
          !item.notransfer
        )
      ) {
        return false;
      }

      const duplicates = computeDupes(stores);
      const dupeId = makeDupeID(item);
      const dupes = duplicates[dupeId];
      if (dupes?.length > 1) {
        // TODO: this re-sorts on every duplicate item, but that might be faster overall!
        const dupeComparator = makeDupeComparator(itemInfos, itemHashTags);
        dupes.sort(dupeComparator);
        const bestDupe = dupes[0];
        return item !== bestDupe;
      }

      return false;
    },
  },
  {
    keywords: ['count'],
    description: [tl('Filter.Dupe')],
    format: 'range',
    filterValuePreprocessor: rangeStringToComparator,
    filterFunction: (
      item: DimItem,
      filterValue: (compare: number) => boolean,
      { stores }: FilterContext
    ) => {
      const duplicates = computeDupes(stores);
      const dupeId = makeDupeID(item);
      return filterValue(duplicates[dupeId]?.length ?? 0);
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
    item.bucket.hash !== SEASONAL_ARTIFACT_BUCKET
  );
}
