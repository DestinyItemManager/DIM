import { settingSelector } from 'app/dim-api/selectors';
import { DimItem } from 'app/inventory/item-types';
import {
  createItemContextSelector,
  ownedItemsSelector,
  ownedUncollectiblePlugsSelector,
  sortedStoresSelector,
} from 'app/inventory/selectors';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { searchFilterSelector } from 'app/search/search-filter';
import { querySelector } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { currySelector } from 'app/utils/selector-utils';
import _ from 'lodash';
import { createSelector } from 'reselect';
import {
  D2Vendor,
  D2VendorGroup,
  VendorFilterFunction,
  filterToNoSilver,
  filterToSearch,
  filterToUnacquired,
  toVendorGroups,
} from './d2-vendors';
import { VendorItem } from './vendor-item';

export const vendorsByCharacterSelector = (state: RootState) => state.vendors.vendorsByCharacter;

/**
 * returns a character's vendors and their sale items
 */
export const vendorGroupsForCharacterSelector = currySelector(
  createSelector(
    createItemContextSelector,
    vendorsByCharacterSelector,
    // get character ID from props not state
    (state: RootState, characterId: string | undefined) =>
      characterId || getCurrentStore(sortedStoresSelector(state))?.id,
    (context, vendors, selectedStoreId) => {
      const vendorData = selectedStoreId ? vendors[selectedStoreId] : undefined;
      const vendorsResponse = vendorData?.vendorsResponse;

      return vendorsResponse && vendorData && selectedStoreId
        ? toVendorGroups(context, vendorsResponse, selectedStoreId)
        : emptyArray<D2VendorGroup>();
    }
  )
);

export const showUnacquiredVendorItemsOnlySelector = (state: RootState) =>
  state.vendors.showUnacquiredOnly;

/**
 * Returns vendor items (for comparison, loadout builder, ...)
 */
export const characterVendorItemsSelector = createSelector(
  (_state: RootState, vendorCharacterId?: string) => vendorCharacterId,
  vendorGroupsForCharacterSelector.selector,
  (vendorCharacterId, vendorGroups) => {
    if (!vendorCharacterId) {
      return emptyArray<DimItem>();
    }
    return _.compact(
      vendorGroups.flatMap((vg) => vg.vendors.flatMap((vs) => vs.items.map((vi) => vi.item)))
    );
  }
);

export const ownedVendorItemsSelector = currySelector(
  createSelector(
    ownedItemsSelector,
    ownedUncollectiblePlugsSelector,
    (_: any, storeId?: string) => storeId,
    (ownedItems, ownedPlugs, storeId) =>
      new Set([
        ...ownedItems.accountWideOwned,
        ...ownedPlugs.accountWideOwned,
        ...((storeId && ownedItems.storeSpecificOwned[storeId]) || []),
        ...((storeId && ownedPlugs.storeSpecificOwned[storeId]) || []),
      ])
  )
);

export const vendorItemFilterSelector = currySelector(
  createSelector(
    ownedVendorItemsSelector.selector,
    showUnacquiredVendorItemsOnlySelector,
    querySelector,
    searchFilterSelector,
    (state: RootState) => settingSelector('vendorsHideSilverItems')(state),
    (ownedItemHashes, showUnacquiredOnly, query, itemFilter, hideSilver) => {
      const filters: VendorFilterFunction[] = [];
      if (hideSilver) {
        filters.push(filterToNoSilver());
      }
      if (showUnacquiredOnly) {
        filters.push(filterToUnacquired(ownedItemHashes));
      }
      if (query.length) {
        filters.push(filterToSearch(query, itemFilter));
      }
      return (item: VendorItem, vendor: D2Vendor) => filters.every((f) => f(item, vendor));
    }
  )
);
