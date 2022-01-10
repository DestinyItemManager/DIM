import { currentAccountSelector } from 'app/accounts/selectors';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { accountRoute } from 'app/routes';
import { filterFactorySelector } from 'app/search/search-filter';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { currySelector } from 'app/utils/redux-utils';
import { nonCurriedVendorGroupsForCharacterSelector } from 'app/vendors/selectors';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { createSelector } from 'reselect';

/**
 * The current compare session settings.
 */
export const compareSessionSelector = (state: RootState) => state.compare.session;

export const compareOpenSelector = (state: RootState) => Boolean(compareSessionSelector(state));

/**
 * Returns vendor items for comparison
 */
const compareVendorItemsSelector = createSelector(
  (_state: RootState, vendorCharacterId?: string) => vendorCharacterId,
  nonCurriedVendorGroupsForCharacterSelector,
  (vendorCharacterId, vendorGroups) => {
    if (!vendorCharacterId) {
      return emptyArray<DimItem>();
    }
    return _.compact(
      vendorGroups.flatMap((vg) => vg.vendors.flatMap((vs) => vs.items.map((vi) => vi.item)))
    );
  }
);

/**
 * Returns all the items matching the item category of the current compare session.
 */
export const compareCategoryItemsSelector = createSelector(
  (state: RootState) => state.compare.session?.itemCategoryHashes,
  allItemsSelector,
  compareVendorItemsSelector,
  (itemCategoryHashes, allItems, vendorItems) => {
    if (!itemCategoryHashes) {
      return emptyArray<DimItem>();
    }
    return [...allItems, ...vendorItems].filter((i) =>
      itemCategoryHashes.every((h) => i.itemCategoryHashes.includes(h))
    );
  }
);

/**
 * Returns all the items being compared.
 */
export const compareItemsSelector = currySelector(
  createSelector(
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
  )
);

const organizerTypes = [
  ItemCategoryHashes.Armor,
  ItemCategoryHashes.Weapon,
  ItemCategoryHashes.Ghost,
];

/**
 * Returns a link to the organizer for the current compare search.
 */
export const compareOrganizerLinkSelector = createSelector(
  currentAccountSelector,
  compareSessionSelector,
  (account, session) => {
    if (!session || !account || !organizerTypes.includes(session.itemCategoryHashes[0])) {
      return undefined;
    }
    return `${accountRoute(account)}/organizer?category=${session.itemCategoryHashes.join(
      '~'
    )}&search=${encodeURIComponent(session.query)}`;
  }
);
