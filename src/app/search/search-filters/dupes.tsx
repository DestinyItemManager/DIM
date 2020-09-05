import { tl } from 'app/i18next-t';
import { getTag } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { itemInfosSelector } from 'app/inventory/selectors';
import { RootState } from 'app/store/types';
import _ from 'lodash';
import { chainComparator, compareBy, reverseComparator } from '../../utils/comparators';
import { DEFAULT_SHADER } from '../d2-known-values';
import { FilterDefinition } from '../filter-types';
import { rangeStringToComparator } from './range-numeric';

export let _duplicates: { [dupeID: string]: DimItem[] } | null = null; // Holds a map from item hash to count of occurrances of that hash
const _lowerDupes = {};

const dupeFilters: FilterDefinition[] = [
  {
    keywords: ['dupe'],
    description: [tl('Filter.Dupe')],
    format: 'simple',
    destinyVersion: 0,
    contextGenerator: initDupes,
    filterFunction: checkIfIsDupe,
  },
  {
    keywords: ['dupelower'],
    description: [tl('Filter.Dupe')],
    format: 'simple',
    destinyVersion: 0,
    contextGenerator: initDupes,
    filterFunction: (item: DimItem) => _lowerDupes[item.id],
  },
  {
    keywords: ['count'],
    description: [tl('Filter.Dupe')],
    format: 'range',
    destinyVersion: 0,
    contextGenerator: initDupes,
    filterValuePreprocessor: rangeStringToComparator,
    filterFunction: (item: DimItem, filterValue: (compare: number) => boolean) => {
      const dupeId = makeDupeID(item);
      return filterValue(_duplicates?.[dupeId]?.length ?? 0);
    },
  },
];

export default dupeFilters;

export function checkIfIsDupe(item: DimItem) {
  const dupeId = makeDupeID(item);
  return (
    _duplicates?.[dupeId] &&
    !item.itemCategoryHashes.includes(58) &&
    item.hash !== DEFAULT_SHADER &&
    item.bucket.hash !== 1506418338 &&
    _duplicates[dupeId].length > 1
  );
}

/**
 * outputs a string combination of the identifying features of an item, or the hash if classified.
 * if 2 things have the same name, classType, tier, and itemCategoryHashes, they are considered the same.
 */
function makeDupeID(item: DimItem) {
  return (
    (item.classified && String(item.hash)) ||
    `${item.name}${item.classType}${item.tier}${item.itemCategoryHashes.join('.')}`
  );
}

const state: RootState = {} as RootState;
const itemInfos = itemInfosSelector(state);
const notableTags = ['favorite', 'keep'];

const dupeComparator = reverseComparator(
  chainComparator<DimItem>(
    // primary stat
    compareBy((item: DimItem) => item.primStat?.value),
    compareBy((item: DimItem) => item.masterwork),
    compareBy((item: DimItem) => item.locked),
    compareBy((item: DimItem) => {
      const tag = getTag(item, itemInfos);
      return Boolean(tag && notableTags.includes(tag));
    }),
    compareBy((item: DimItem) => item.id) // tiebreak by ID
  )
);

export function initDupes(
  allItems: DimItem[]
  // stores: DimStore[],itemInfos: ItemInfos
) {
  // The comparator for sorting dupes - the first item will be the "best" and all others are "dupelower".
  const stores = allItems[0].getStoresService().getStores();

  if (_duplicates === null) {
    _duplicates = {};
    for (const store of stores) {
      for (const i of store.items) {
        const dupeID = makeDupeID(i);
        if (!_duplicates[dupeID]) {
          _duplicates[dupeID] = [];
        }
        _duplicates[dupeID].push(i);
      }
    }

    _.forIn(_duplicates, (dupes: DimItem[]) => {
      if (dupes.length > 1) {
        dupes.sort(dupeComparator);
        const bestDupe = dupes[0];
        for (const dupe of dupes) {
          if (
            dupe.bucket &&
            (dupe.bucket.sort === 'Weapons' || dupe.bucket.sort === 'Armor') &&
            !dupe.notransfer
          ) {
            _lowerDupes[dupe.id] = dupe !== bestDupe;
          }
        }
      }
    });
  }
}
