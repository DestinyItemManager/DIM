import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { currentProfileSelector, settingsSelector } from 'app/dim-api/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { emptyObject, emptySet } from 'app/utils/empty';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import { createSelector } from 'reselect';
import { getBuckets as getBucketsD1 } from '../destiny1/d1-buckets';
import { getBuckets as getBucketsD2 } from '../destiny2/d2-buckets';
import { characterSortImportanceSelector, characterSortSelector } from '../settings/character-sort';
import { getTag, ItemInfos } from './dim-item-info';
import { DimItem } from './item-types';
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

/** Bucket hashes for buckets that we actually show on the inventory page. */
export const displayableBucketHashesSelector = createSelector(bucketsSelector, (buckets) =>
  buckets
    ? new Set(
        Object.keys(buckets.byCategory).flatMap((category) =>
          buckets.byCategory[category].map((b) => b.hash)
        )
      )
    : emptySet<number>()
);

/** All stores, sorted according to user preference. */
export const sortedStoresSelector = createSelector(
  storesSelector,
  characterSortSelector,
  (stores, sortStores) => sortStores(stores)
);

/** Sorted by "importance" which handles reversed sorting a bit better - for menus only */
export const storesSortedByImportanceSelector = createSelector(
  characterSortImportanceSelector,
  storesSelector,
  (sort, stores) => sort(stores)
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

/** The inventoryItemIds of all items that are "new". */
export const newItemsSelector = (state: RootState) => state.inventory.newItems;

export const isNewSelector = (item: DimItem) => (state: RootState) =>
  settingsSelector(state).showNewItems ? newItemsSelector(state).has(item.id) : false;

const visibleCurrencies = [
  3159615086, // Glimmer
  1022552290, // Legendary Shards
  2817410917, // Bright Dust
  3147280338, // Silver
  2534352370, // Legendary Marks (D1)
  2749350776, // Silver (D1)
];

/** Account wide currencies */
export const currenciesSelector = createSelector(
  (state: RootState) => state.inventory.currencies,
  (currencies) => currencies.filter((c) => visibleCurrencies.includes(c.itemHash))
);

/** materials/currencies that aren't top level stuff */
export const materialsSelector = (state: RootState) =>
  allItemsSelector(state).filter(
    (i) =>
      i.itemCategoryHashes.includes(ItemCategoryHashes.Materials) ||
      i.itemCategoryHashes.includes(ItemCategoryHashes.ReputationTokens)
  );

/** The actual raw profile response from the Bungie.net profile API */
export const profileResponseSelector = (state: RootState) => state.inventory.profileResponse;

/** A set containing all the hashes of owned items. */
export const ownedItemsSelector = createSelector(
  profileResponseSelector,
  allItemsSelector,
  (profileResponse, allItems) => {
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
  }
);

/** gets all the dynamic strings from a profile response */
export const dynamicStringsSelector = (state: RootState) => {
  const profileResp = profileResponseSelector(state);
  if (profileResp) {
    const { profileStringVariables, characterStringVariables } = profileResp;
    const allProfile: {
      // are these keys really strings? no. are they numbers? yes. but are all keys strings in js? yes
      // and are they being extracted from strings and not worth converting to numbers just to convert back to strings? yes
      [valueHash: string]: number;
    } = profileStringVariables?.data?.integerValuesByHash ?? {};
    const byCharacter: {
      [charId: string]: {
        [valueHash: string]: number;
      };
    } = {};
    for (const charId in characterStringVariables?.data) {
      byCharacter[charId] = characterStringVariables.data?.[charId].integerValuesByHash ?? {};
    }
    return {
      allProfile,
      byCharacter,
    };
  }
};

/** Item infos (tags/notes) */
export const itemInfosSelector = (state: RootState): ItemInfos =>
  currentProfileSelector(state)?.tags || emptyObject();

/**
 * DIM tags which should be applied to matching item hashes (instead of per-instance)
 */
export const itemHashTagsSelector = (state: RootState): { [itemHash: string]: ItemHashTag } =>
  state.dimApi.itemHashTags;

/** Get a specific item's tag */
export const tagSelector = (item: DimItem) => (state: RootState) =>
  getTag(item, itemInfosSelector(state), itemHashTagsSelector(state));

/**
 * all hashtags used in existing item notes, with (case-insensitive) dupes removed
 */
export const allNotesHashtagsSelector = createSelector(itemInfosSelector, collectNotesHashtags);
