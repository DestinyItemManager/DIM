import { settingSelector } from 'app/dim-api/selectors';
import { DimItem } from 'app/inventory/item-types';
import {
  createItemContextSelector,
  ownedItemsSelector,
  ownedUncollectiblePlugsSelector,
  sortedStoresSelector,
} from 'app/inventory/selectors';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { searchFilterSelector } from 'app/search/items/item-search-filter';
import { querySelector } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { compact } from 'app/utils/collections';
import { emptyArray } from 'app/utils/empty';
import { currySelector } from 'app/utils/selectors';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
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
    },
  ),
);

const subVendorsForCharacterSelector = currySelector(
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
          if (vendorHash && !subvendors[vendorHash]) {
            const vendor = toVendor(
              {
                ...context,
                itemComponents: vendorsResponse.itemComponents?.[vendorHash],
              },
              item.previewVendorHash,
              vendorsResponse.vendors.data?.[vendorHash],
              selectedStoreId,
              vendorsResponse.sales.data?.[vendorHash]?.saleItems,
              vendorsResponse,
            );
            if (vendor) {
              subvendors[vendorHash] = vendor;
              workList.push(vendor);
            }
          }
        }
      }
      return subvendors;
    },
  ),
);

export const showUnacquiredVendorItemsOnlySelector = (state: RootState) =>
  state.vendors.showUnacquiredOnly;

/**
 * Returns vendor items (for comparison, loadout builder, ...)
 */
export const characterVendorItemsSelector = createSelector(
  (_state: RootState, vendorCharacterId?: string) => vendorCharacterId,
  vendorGroupsForCharacterSelector.selector,
  subVendorsForCharacterSelector.selector,
  (vendorCharacterId, vendorGroups, subVendors) => {
    if (!vendorCharacterId) {
      return emptyArray<DimItem>();
    }
    return compact(
      vendorGroups
        .flatMap((vg) => vg.vendors)
        .concat(Object.values(subVendors))
        .flatMap((vs) => vs.items.map((vi) => vi.item))
        .filter((i) => !i?.itemCategoryHashes.includes(ItemCategoryHashes.Dummies)),
    );
  },
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
      ]),
  ),
);

export const vendorItemFilterSelector = currySelector(
  createSelector(
    ownedVendorItemsSelector.selector,
    showUnacquiredVendorItemsOnlySelector,
    subVendorsForCharacterSelector.selector,
    querySelector,
    searchFilterSelector,
    settingSelector<'vendorsHideSilverItems'>('vendorsHideSilverItems'),
    (ownedItemHashes, showUnacquiredOnly, subVendors, query, itemFilter, hideSilver) => {
      const filters: VendorFilterFunction[] = [];
      const silverFilter = filterToNoSilver();
      if (hideSilver) {
        filters.push(silverFilter);
      }
      if (showUnacquiredOnly) {
        filters.push(filterToUnacquired(ownedItemHashes));
      }
      if (query.length) {
        filters.push(filterToSearch(query, itemFilter));
      }
      function filterItem(item: VendorItem, vendor: D2Vendor, seenVendors: number[]): boolean {
        if (filters.every((f) => f(item, vendor))) {
          // Our filters match this item or vendor directly
          return true;
        }

        // If this item is a subvendor, check if one of the subvendor's items match filters
        // But don't allow this if the item itself fails the silver check -- most eververse
        // bundles cost silver, but their contained items don't, but we still want to hide
        // the bundle if "hide silver" is on.
        // Finally, prevent infinite recursion for subvendors because that can happen.
        const previewVendorHash = item.item?.previewVendor;
        if (
          previewVendorHash &&
          !seenVendors.includes(previewVendorHash) &&
          (!hideSilver || silverFilter(item, vendor))
        ) {
          const subVendorData = subVendors[previewVendorHash];
          if (subVendorData) {
            return subVendorData.items.some((subItem) =>
              filterItem(subItem, subVendorData, [...seenVendors, previewVendorHash]),
            );
          }
        }
        return false;
      }
      return (item: VendorItem, vendor: D2Vendor) => filterItem(item, vendor, []);
    },
  ),
);
