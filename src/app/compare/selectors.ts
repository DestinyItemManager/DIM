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

/**
 * Returns all the items being compared.
 */
export const compareItemsSelector = createSelector(
  compareSessionSelector,
  allItemsSelector,
  filterFactorySelector,
  (session, allItems, filterFactorySelector) => {
    if (!session) {
      return emptyArray<DimItem>();
    }
    const filterFunction = filterFactorySelector(session.query);
    return allItems.filter(
      (i) => i.itemCategoryHashes.includes(session.itemCategoryHash) && filterFunction(i)
    );
  }
);
