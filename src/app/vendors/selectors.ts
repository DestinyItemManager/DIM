import { currentAccountSelector } from 'app/accounts/selectors';
import {
  bucketsSelector,
  ownedItemsSelector,
  ownedUncollectiblePlugsSelector,
  profileResponseSelector,
  sortedStoresSelector,
} from 'app/inventory/selectors';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { currySelector } from 'app/utils/redux-utils';
import {
  DestinyCollectiblesComponent,
  DestinyProfileCollectiblesComponent,
  DictionaryComponentResponse,
  SingleComponentResponse,
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { createSelector } from 'reselect';
import { D2VendorGroup, toVendorGroups } from './d2-vendors';
import { MergedCollectibles } from './vendor-item';

export const vendorsByCharacterSelector = (state: RootState) => state.vendors.vendorsByCharacter;

const emptyCollectibles: MergedCollectibles = {
  profileCollectibles: {},
  characterCollectibles: {},
};

export function mergeCollectibles(
  profileCollectibles: SingleComponentResponse<DestinyProfileCollectiblesComponent>,
  characterCollectibles: DictionaryComponentResponse<DestinyCollectiblesComponent>
): MergedCollectibles {
  return {
    profileCollectibles: profileCollectibles?.data?.collectibles ?? {},
    characterCollectibles: _.mapValues(
      characterCollectibles.data ?? {},
      (c) => c.collectibles ?? {}
    ),
  };
}

export const mergedCollectiblesSelector = createSelector(
  profileResponseSelector,
  (profileResponse) =>
    profileResponse
      ? mergeCollectibles(
          profileResponse.profileCollectibles,
          profileResponse.characterCollectibles
        )
      : emptyCollectibles
);

/**
 * returns a character's vendors and their sale items
 */
export const nonCurriedVendorGroupsForCharacterSelector = createSelector(
  d2ManifestSelector,
  vendorsByCharacterSelector,
  mergedCollectiblesSelector,
  bucketsSelector,
  currentAccountSelector,
  profileResponseSelector,
  // get character ID from props not state
  (state: any, characterId: string | undefined) =>
    characterId || getCurrentStore(sortedStoresSelector(state))?.id,
  (
    defs,
    vendors,
    mergedCollectibles,
    buckets,
    currentAccount,
    profileResponse,
    selectedStoreId
  ) => {
    const vendorData = selectedStoreId ? vendors[selectedStoreId] : undefined;
    const vendorsResponse = vendorData?.vendorsResponse;

    return vendorsResponse &&
      defs &&
      buckets &&
      currentAccount &&
      selectedStoreId &&
      profileResponse
      ? toVendorGroups(
          vendorsResponse,
          profileResponse,
          defs,
          buckets,
          currentAccount,
          selectedStoreId,
          mergedCollectibles
        )
      : emptyArray<D2VendorGroup>();
  }
);
/**
 * returns a character's vendors and their sale items
 */
export const vendorGroupsForCharacterSelector = currySelector(
  nonCurriedVendorGroupsForCharacterSelector
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
