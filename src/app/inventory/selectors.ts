import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { currentProfileSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import { emptyObject } from 'app/utils/empty';
import { createSelector } from 'reselect';
import { getBuckets as getBucketsD1 } from '../destiny1/d1-buckets';
import { getBuckets as getBucketsD2 } from '../destiny2/d2-buckets';
import { characterSortSelector } from '../settings/character-sort';
import { ItemInfos } from './dim-item-info';
import { getCurrentStore } from './stores-helpers';

/** All stores, unsorted. */
export const storesSelector = (state: RootState) => state.inventory.stores;

export const bucketsSelector = createSelector(
  destinyVersionSelector,
  (state: RootState) => state.manifest.d1Manifest,
  (state: RootState) => state.manifest.d2Manifest,
  (destinyVersion, d1Manifest, d2Manifest) =>
    destinyVersion === 2
      ? d2Manifest && getBucketsD2(d2Manifest)
      : d1Manifest && getBucketsD1(d1Manifest)
);

/** All stores, sorted according to user preference. */
export const sortedStoresSelector = createSelector(
  storesSelector,
  characterSortSelector,
  (stores, sortStores) => sortStores(stores)
);

export const isPhonePortraitSelector = (state: RootState) => state.shell.isPhonePortrait;

/** Have stores been loaded? */
export const storesLoadedSelector = (state: RootState) => storesSelector(state).length > 0;

/** The current (last played) character */
export const currentStoreSelector = (state: RootState) => getCurrentStore(storesSelector(state));

/** The actual raw profile response from the Bungie.net profile API */
export const profileResponseSelector = (state: RootState) => state.inventory.profileResponse;

/** A set containing all the hashes of owned items. */
export const ownedItemsSelector = () =>
  createSelector(profileResponseSelector, storesSelector, (profileResponse, stores) => {
    const ownedItemHashes = new Set<number>();
    for (const store of stores) {
      for (const item of store.items) {
        ownedItemHashes.add(item.hash);
      }
    }
    if (profileResponse?.profilePlugSets?.data) {
      for (const plugSet of Object.values(profileResponse.profilePlugSets.data.plugs)) {
        for (const plug of plugSet) {
          if (plug.canInsert) {
            ownedItemHashes.add(plug.plugItemHash);
          }
        }
      }
    }
    return ownedItemHashes;
  });

/** Item infos (tags/notes) */
export const itemInfosSelector = (state: RootState): ItemInfos =>
  currentProfileSelector(state)?.tags || emptyObject();

export const itemHashTagsSelector = (state: RootState): { [itemHash: string]: ItemHashTag } =>
  state.dimApi.itemHashTags;
