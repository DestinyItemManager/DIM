import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { currentProfileSelector } from 'app/dim-api/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { emptyObject } from 'app/utils/empty';
import { createSelector } from 'reselect';
import { getBuckets as getBucketsD1 } from '../destiny1/d1-buckets';
import { getBuckets as getBucketsD2 } from '../destiny2/d2-buckets';
import { characterSortSelector } from '../settings/character-sort';
import { ItemInfos } from './dim-item-info';
import { collectNotesHashtags } from './note-hashtags';
import { getCurrentStore, getVault } from './stores-helpers';

/** All stores, unsorted. */
export const storesSelector = (state: RootState) => state.inventory.stores;

export const bucketsSelector = createSelector(
  destinyVersionSelector,
  (state: RootState) => state.manifest.d1Manifest,
  d2ManifestSelector,
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

/**
 * Get a flat list of all items.
 */
export const allItemsSelector = createSelector(storesSelector, (stores) =>
  stores.flatMap((s) => s.items)
);

/** Have stores been loaded? */
export const storesLoadedSelector = (state: RootState) => storesSelector(state).length > 0;

/** The current (last played) character */
export const currentStoreSelector = (state: RootState) => getCurrentStore(storesSelector(state));

/** The vault */
export const vaultSelector = (state: RootState) => getVault(storesSelector(state));

/** Account wide currencies */
export const currenciesSelector = (state: RootState) => state.inventory.currencies;

/** The actual raw profile response from the Bungie.net profile API */
export const profileResponseSelector = (state: RootState) => state.inventory.profileResponse;

/** A set containing all the hashes of owned items. */
export const ownedItemsSelector = () =>
  createSelector(profileResponseSelector, allItemsSelector, (profileResponse, allItems) => {
    const ownedItemHashes = new Set<number>();
    for (const item of allItems) {
      ownedItemHashes.add(item.hash);
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

/**
 * DIM tags which should be applied to matching item hashes (instead of per-instance)
 */
export const itemHashTagsSelector = (state: RootState): { [itemHash: string]: ItemHashTag } =>
  state.dimApi.itemHashTags;

/**
 * all hashtags used in existing item notes, with (case-insensitive) dupes removed
 */
export const allNotesHashtagsSelector = createSelector(itemInfosSelector, collectNotesHashtags);
