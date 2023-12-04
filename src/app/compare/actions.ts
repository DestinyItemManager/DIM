import { DimItem } from 'app/inventory/item-types';
import { createAction } from 'typesafe-actions';

/** Add an item to the set of compared items. If there are none already, this compares duplicates. */
export const addCompareItem = createAction('compare/ADD_ITEM')<DimItem>();

export const removeCompareItem = createAction('compare/REMOVE_ITEM')<DimItem>();

/** End a compare session (close the compare tool) */
export const endCompareSession = createAction('compare/END_SESSION')();

/** Update the query of an active compare session */
export const updateCompareQuery = createAction('compare/UPDATE_QUERY')<string>();

/** Compare items that match a search filter. */
export const compareFilteredItems = createAction(
  'compare/FILTERED_ITEMS',
  // Do we really need the items?
  (
    query: string,
    filteredItems: DimItem[],
    /** The first item added to compare, so we can highlight it. */
    initialItem: DimItem | undefined,
  ) => ({ query, filteredItems, initialItem }),
)();

/** Compare a specific set of items. */
export const compareSelectedItems = createAction('compare/SELECTED_ITEMS')<DimItem[]>();
