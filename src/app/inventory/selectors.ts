import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { currentProfileSelector, settingSelector, settingsSelector } from 'app/dim-api/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { emptyObject, emptySet } from 'app/utils/empty';
import { currySelector } from 'app/utils/redux-utils';
import { DestinyItemPlug } from 'bungie-api-ts/destiny2';
import { resonantMaterialStringVarHashes } from 'data/d2/crafting-resonant-elements';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import universalOrnamentPlugSetHashes from 'data/d2/universal-ornament-plugset-hashes.json';
import { createSelector } from 'reselect';
import { getBuckets as getBucketsD1 } from '../destiny1/d1-buckets';
import { getBuckets as getBucketsD2 } from '../destiny2/d2-buckets';
import { characterSortImportanceSelector, characterSortSelector } from '../settings/character-sort';
import { getTag, ItemInfos } from './dim-item-info';
import { DimItem } from './item-types';
import { collectNotesHashtags } from './note-hashtags';
import { ItemCreationContext } from './store/d2-item-factory';
import { getCurrentStore, getVault } from './stores-helpers';

/** All stores, unsorted. */
export const storesSelector = (state: RootState) => state.inventory.stores;

export const d2BucketsSelector = createSelector(
  (state: RootState) => state.manifest.d2Manifest,
  (d2Manifest) => d2Manifest && getBucketsD2(d2Manifest)
);

export const d1BucketsSelector = createSelector(
  (state: RootState) => state.manifest.d1Manifest,
  (d1Manifest) => d1Manifest && getBucketsD1(d1Manifest)
);

export const bucketsSelector = createSelector(
  destinyVersionSelector,
  d1BucketsSelector,
  d2BucketsSelector,
  (destinyVersion, d1Buckets, d2Buckets) => (destinyVersion === 2 ? d2Buckets : d1Buckets)
);

/** Bucket hashes for buckets that we actually show on the inventory page. */
export const displayableBucketHashesSelector = createSelector(bucketsSelector, (buckets) =>
  buckets
    ? new Set(Object.values(buckets.byCategory).flatMap((buckets) => buckets.map((b) => b.hash)))
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

const transmogCurrencies = [
  1583786617, // InventoryItem "Synthweave Template"
  4238733045, // InventoryItem "Synthweave Plate"
  1498161294, // InventoryItem "Synthweave Bolt"
  4019412287, // InventoryItem "Synthweave Strap"
];

/** Synthweave {Template, Bolt, Plate, Strap} currencies */
export const transmogCurrenciesSelector = createSelector(
  (state: RootState) => state.inventory.currencies,
  (currencies) => currencies.filter((c) => transmogCurrencies.includes(c.itemHash))
);

/** materials/currencies that aren't top level stuff */
export const materialsSelector = (state: RootState) =>
  allItemsSelector(state).filter(
    (i) =>
      i.itemCategoryHashes.includes(ItemCategoryHashes.Materials) ||
      i.itemCategoryHashes.includes(ItemCategoryHashes.ReputationTokens) ||
      i.hash === 3702027555 || // Spoils of Conquest do not have item category hashes
      i.hash === 1289622079 // neither do Strand Meditations
  );

/** The actual raw profile response from the Bungie.net profile API */
export const profileResponseSelector = (state: RootState) =>
  state.inventory.mockProfileData ?? state.inventory.profileResponse;

/** Whether or not the user is currently playing Destiny 2 */
export const userIsPlayingSelector = (state: RootState) =>
  Boolean(state.inventory.profileResponse?.profileTransitoryData?.data);

/** The time when the currently displayed profile was last refreshed from live game data */
export const profileMintedSelector = createSelector(
  profileResponseSelector,
  (profileResponse) => new Date(profileResponse?.responseMintedTimestamp ?? 0)
);

export const profileErrorSelector = (state: RootState) => state.inventory.profileError;

/** A variant of profileErrorSelector which returns undefined if we still have a valid profile to use despite the error. */
export const blockingProfileErrorSelector = (state: RootState) =>
  state.inventory.profileResponse ? undefined : state.inventory.profileError;

/** Whether DIM will automatically refresh on a schedule */
export const autoRefreshEnabledSelector = (state: RootState) =>
  userIsPlayingSelector(state) && state.dimApi.globalSettings.autoRefresh;

/** returns name/icon/amount for a hard-coded list of crafting materials */
export const craftingMaterialCountsSelector = createSelector(
  d2ManifestSelector,
  profileResponseSelector,
  (defs, profileResponse) => {
    const numbersLookup = profileResponse?.profileStringVariables?.data?.integerValuesByHash;
    const results: [name: string, icon: string, count: number][] = [];

    if (defs && numbersLookup) {
      for (const { materialHash, currentCountHash } of resonantMaterialStringVarHashes) {
        const def = defs.InventoryItem.get(materialHash);

        if (def) {
          const { icon, name } = def.displayProperties;
          const count = numbersLookup[currentCountHash];
          if (icon && name && count !== undefined) {
            results.push([name, icon, count]);
          }
        }
      }
    }
    return results;
  }
);

/**
 * All the dependencies for item creation. Don't use this before profile is loaded...
 */
export const createItemContextSelector = createSelector(
  d2ManifestSelector,
  profileResponseSelector,
  bucketsSelector,
  (state: RootState) => settingSelector('customTotalStatsByClass')(state),
  (defs, profileResponse, buckets, customTotalStatsByClass): ItemCreationContext => ({
    defs: defs!,
    buckets: buckets!,
    profileResponse: profileResponse!,
    customTotalStatsByClass,
  })
);

const STORE_SPECIFIC_OWNERSHIP_BUCKETS = [
  // Emblems cannot be transferred between characters and if one character owns an emblem,
  // other characters don't really own it. Also affects vendor claimability.
  BucketHashes.Emblems,
  // Quests and bounties are character-specific.
  BucketHashes.Quests,
];

/**
 * Sets of items considered "owned" for checkmark purposes, some
 * account-scoped, some character-scoped.
 *
 * Most items are considered owned from the view of a character if
 * they're in any bucket because they can be transferred or are in
 * the consumables bucket, but for quests and bounties, it's necessary
 * to see whether the current character has them.
 */
export interface OwnedItemsInfo {
  accountWideOwned: Set<number>;
  storeSpecificOwned: {
    [key: string]: Set<number>;
  };
}

/**
 * Sets containing all the hashes of owned items, globally and from the
 * view of individual characters. Excludes plugs, see
 * ownedUncollectiblePlugsSelector for those.
 */
export const ownedItemsSelector = createSelector(allItemsSelector, (allItems) => {
  const accountWideOwned = new Set<number>();
  const storeSpecificOwned: { [owner: string]: Set<number> } = {};
  for (const item of allItems) {
    if (STORE_SPECIFIC_OWNERSHIP_BUCKETS.includes(item.bucket.hash)) {
      if (!storeSpecificOwned[item.owner]) {
        storeSpecificOwned[item.owner] = new Set();
      }
      storeSpecificOwned[item.owner].add(item.hash);
    } else {
      accountWideOwned.add(item.hash);
    }
  }

  return { accountWideOwned, storeSpecificOwned };
});

/**
 * Sets containing all the hashes of owned uncollectible plug items,
 * e.g. emotes and ghost projections. These plug items do not appear
 * in collections, so we use plug availability from the profile response
 * to mark them as "owned". Plugs where the associated item has a
 * collectibleHash will never be included.
 */
export const ownedUncollectiblePlugsSelector = createSelector(
  d2ManifestSelector,
  profileResponseSelector,
  (defs, profileResponse) => {
    const accountWideOwned = new Set<number>();
    const storeSpecificOwned = {};

    if (defs && profileResponse) {
      const processPlugSet = (
        plugs: { [key: number]: DestinyItemPlug[] },
        insertInto: Set<number>
      ) => {
        for (const plugSet of Object.values(plugs)) {
          for (const plug of plugSet) {
            if (plug.enabled && !defs.InventoryItem.get(plug.plugItemHash)?.collectibleHash) {
              insertInto.add(plug.plugItemHash);
            }
          }
        }
      };

      if (profileResponse.profilePlugSets?.data) {
        processPlugSet(profileResponse.profilePlugSets.data.plugs, accountWideOwned);
      }

      if (profileResponse.characterPlugSets?.data) {
        for (const [storeId, plugSetData] of Object.entries(
          profileResponse.characterPlugSets.data
        )) {
          if (!storeSpecificOwned[storeId]) {
            storeSpecificOwned[storeId] = new Set();
          }
          processPlugSet(plugSetData.plugs, storeSpecificOwned[storeId]);
        }
      }
    }

    return { accountWideOwned, storeSpecificOwned };
  }
);

/** A set containing all the hashes of unlocked PlugSet items (mods, shaders, ornaments, etc) for the given character. */
// TODO: reconcile with other owned/unlocked selectors
export const unlockedPlugSetItemsSelector = currySelector(
  createSelector(
    (_state: RootState, characterId?: string) => characterId,
    profileResponseSelector,
    (characterId, profileResponse) => {
      const unlockedPlugs = new Set<number>();
      if (profileResponse?.profilePlugSets.data?.plugs) {
        for (const plugSetHashStr in profileResponse.profilePlugSets.data.plugs) {
          const plugSetHash = parseInt(plugSetHashStr, 10);
          const plugs = profileResponse.profilePlugSets.data.plugs[plugSetHash];
          for (const plugSetItem of plugs) {
            const useCanInsert = universalOrnamentPlugSetHashes.includes(plugSetHash);
            if (useCanInsert ? plugSetItem.canInsert : plugSetItem.enabled) {
              unlockedPlugs.add(plugSetItem.plugItemHash);
            }
          }
        }
      }
      if (characterId && profileResponse?.characterPlugSets.data?.[characterId]?.plugs) {
        for (const plugSetHashStr in profileResponse.characterPlugSets.data[characterId].plugs) {
          const plugSetHash = parseInt(plugSetHashStr, 10);
          const plugs = profileResponse.characterPlugSets.data[characterId].plugs[plugSetHash];
          for (const plugSetItem of plugs) {
            const useCanInsert = universalOrnamentPlugSetHashes.includes(plugSetHash);
            if (useCanInsert ? plugSetItem.canInsert : plugSetItem.enabled) {
              unlockedPlugs.add(plugSetItem.plugItemHash);
            }
          }
        }
      }
      return unlockedPlugs;
    }
  )
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
