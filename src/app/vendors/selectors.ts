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
  toVendor,
  toVendorGroups,
} from './d2-vendors';
import { VendorItem } from './vendor-item';

export const vendorsByCharacterSelector = (state: RootState) => state.vendors.vendorsByCharacter;

// get character ID from props not state
const vendorCharacterIdSelector = (state: RootState, characterId: string | undefined) =>
  characterId || getCurrentStore(sortedStoresSelector(state))?.id;

/**
 * returns a character's vendors and their sale items
 */
export const vendorGroupsForCharacterSelector = currySelector(
  createSelector(
    createItemContextSelector,
    vendorsByCharacterSelector,
    vendorCharacterIdSelector,
    (context, vendors, selectedStoreId) => {
      if (!context.defs || !context.buckets || !context.profileResponse) {
        // createItemContextSelector assumes stuff is already loaded, but
        // the SingleVendorPage still exists and may call this selector prior
        // to everything being loaded...
        return emptyArray<D2VendorGroup>();
      }

      const vendorData = selectedStoreId ? vendors[selectedStoreId] : undefined;
      const vendorsResponse = vendorData?.vendorsResponse;

      return vendorsResponse && vendorData && selectedStoreId
        ? toVendorGroups(context, vendorsResponse, selectedStoreId)
        : emptyArray<D2VendorGroup>();
    }
  )
);

export const subVendorsForCharacterSelector = currySelector(
  createSelector(
    createItemContextSelector,
    vendorsByCharacterSelector,
    vendorGroupsForCharacterSelector.selector,
    vendorCharacterIdSelector,
    (context, vendors, vendorGroups, selectedStoreId) => {
      const vendorData = selectedStoreId ? vendors[selectedStoreId] : undefined;
      const vendorsResponse = vendorData?.vendorsResponse;

      if (!vendorsResponse || !selectedStoreId) {
        return {};
      }

      const subvendors: { [vendorHash: number]: D2Vendor } = {};
      const workList = vendorGroups.flatMap((group) => group.vendors);
      while (workList.length) {
        const vendor = workList.pop()!;
        for (const item of vendor.items) {
          const vendorHash = item.previewVendorHash;
          if (vendorHash && vendorsResponse.itemComponents[vendorHash]) {
            const vendor = toVendor(
              {
                ...context,
                itemComponents: vendorsResponse.itemComponents[vendorHash],
              },
              item.previewVendorHash,
              vendorsResponse.vendors.data?.[vendorHash],
              selectedStoreId,
              vendorsResponse.sales.data?.[vendorHash]?.saleItems,
              vendorsResponse
            );
            if (vendor) {
              subvendors[vendorHash] = vendor;
              workList.push(vendor);
            }
          }
        }
      }
      return subvendors;
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
    subVendorsForCharacterSelector.selector,
    querySelector,
    searchFilterSelector,
    (state: RootState) => settingSelector('vendorsHideSilverItems')(state),
    (ownedItemHashes, showUnacquiredOnly, subVendors, query, itemFilter, hideSilver) => {
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
      function filterItem(item: VendorItem, vendor: D2Vendor): boolean {
        if (filters.every((f) => f(item, vendor))) {
          // Our filters match this item or vendor directly
          return true;
        }
        if (item.item?.previewVendor) {
          // This item is a subvendor, check if one of the subvendor's items match filters
          const subVendorData = subVendors[item.item.previewVendor];
          if (subVendorData) {
            return subVendorData.items.some((subItem) => filterItem(subItem, subVendorData));
          }
        }
        return false;
      }
      return filterItem;
    }
  )
);
