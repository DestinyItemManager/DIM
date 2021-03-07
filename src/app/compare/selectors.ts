import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { filterFactorySelector } from 'app/search/search-filter';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { createSelector } from 'reselect';

/**
 * The current compare session settings.
 */
export const compareSessionSelector = (state: RootState) => state.compare.session;

export const compareOpenSelector = (state: RootState) => Boolean(compareSessionSelector(state));

/**
 * Returns all the items matching the item category of the current compare session.
 */
export const compareCategoryItemsSelector = createSelector(
  (state: RootState) => state.compare.session?.itemCategoryHash,
  allItemsSelector,
  (itemCategoryHash, allItems) => {
    if (!itemCategoryHash) {
      return emptyArray<DimItem>();
    }
    return allItems.filter((i) => i.itemCategoryHashes.includes(itemCategoryHash));
  }
);

/**
 * Returns all the items being compared.
 */
export const compareItemsSelector = createSelector(
  compareSessionSelector,
  compareCategoryItemsSelector,
  filterFactorySelector,
  (session, categoryItems, filterFactorySelector) => {
    if (!session) {
      return emptyArray<DimItem>();
    }
    const filterFunction = filterFactorySelector(session.query);
    return categoryItems.filter(filterFunction);
  }
);
