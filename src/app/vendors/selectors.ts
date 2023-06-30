import { DimItem } from 'app/inventory/item-types';
import {
  createItemContextSelector,
  ownedItemsSelector,
  ownedUncollectiblePlugsSelector,
  sortedStoresSelector,
} from 'app/inventory/selectors';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { currySelector } from 'app/utils/selector-utils';
import _ from 'lodash';
import { createSelector } from 'reselect';
import { D2VendorGroup, toVendorGroups } from './d2-vendors';

export const vendorsByCharacterSelector = (state: RootState) => state.vendors.vendorsByCharacter;

/**
 * returns a character's vendors and their sale items
 */
export const nonCurriedVendorGroupsForCharacterSelector = createSelector(
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
);

/**
 * returns a character's vendors and their sale items
 */
export const vendorGroupsForCharacterSelector = currySelector(
  nonCurriedVendorGroupsForCharacterSelector
);

/**
 * Returns vendor items (for comparison, loadout builder, ...)
 */
export const characterVendorItemsSelector = createSelector(
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
