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
  (state: RootState) => state.compare.session?.itemCategoryHashes,
  allItemsSelector,
  (itemCategoryHashes, allItems) => {
    if (!itemCategoryHashes) {
      return emptyArray<DimItem>();
    }
    return allItems.filter((i) =>
      itemCategoryHashes.every((h) => i.itemCategoryHashes.includes(h))
    );
  }
);

/**
 * Returns all the items being compared.
 */
export const compareItemsSelector = createSelector(
  compareSessionSelector,
  compareCategoryItemsSelector,
  filterFactorySelector,
  (session, categoryItems, filterFactory) => {
    if (!session) {
      return emptyArray<DimItem>();
    }
    const filterFunction = filterFactory(session.query);
    return categoryItems.filter(filterFunction);
  }
);
