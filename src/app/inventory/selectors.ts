import { RootState } from 'app/store/types';
import { createSelector } from 'reselect';
import { characterSortSelector } from '../settings/character-sort';
import _ from 'lodash';
import { currentProfileSelector } from 'app/dim-api/selectors';
import { emptyObject } from 'app/utils/empty';
import { getCurrentStore } from './stores-helpers';
import { ItemInfos } from './dim-item-info';
import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { getBuckets as getBucketsD2 } from '../destiny2/d2-buckets';
import { getBuckets as getBucketsD1 } from '../destiny1/d1-buckets';

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

/** A set containing all the hashes of owned items. */
export const ownedItemsSelector = () =>
  createSelector(storesSelector, (stores) => {
    const ownedItemHashes = new Set<number>();
    for (const store of stores) {
      for (const item of store.items) {
        ownedItemHashes.add(item.hash);
      }
    }
    return ownedItemHashes;
  });

/** The actual raw profile response from the Bungie.net profile API */
export const profileResponseSelector = (state: RootState) => state.inventory.profileResponse;

/** Item infos (tags/notes) */
export const itemInfosSelector = (state: RootState): ItemInfos =>
  currentProfileSelector(state)?.tags || emptyObject();

export const itemHashTagsSelector = (state: RootState): { [itemHash: string]: ItemHashTag } =>
  state.dimApi.itemHashTags;
