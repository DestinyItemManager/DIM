import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { D1Categories } from 'app/destiny1/d1-bucket-categories';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { D1BucketCategory, D2BucketCategory } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { getModExclusionGroup, mapToNonReducedModCostVariant } from 'app/loadout/mod-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { ItemFilter } from 'app/search/filter-types';
import { filterMap } from 'app/utils/collections';
import { isItemLoadoutCompatible, itemCanBeInLoadout } from 'app/utils/item-utils';
import { errorLog } from 'app/utils/log';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyClass, TierType } from 'bungie-api-ts/destiny2';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import { Draft, produce } from 'immer';
import _ from 'lodash';
import { useCallback } from 'react';
import {
  Loadout,
  LoadoutItem,
  ResolvedLoadoutItem,
  ResolvedLoadoutMod,
} from '../loadout/loadout-types';
import { randomLoadout, randomSubclassConfiguration } from './auto-loadouts';
import {
  convertToLoadoutItem,
  createSocketOverridesFromEquipped,
  extractArmorModHashes,
  findItemForLoadout,
  findSameLoadoutItemIndex,
  fromEquippedTypes,
  getUnequippedItemsForLoadout,
  singularBucketHashes,
} from './loadout-utils';

/*
 * This module contains functions for mutating loadouts. Each exported function
 * should return a LoadoutUpdateFunction so it can be used directly in useState
 * setters.
 */

/**
 * A function that takes a loadout and returns a modified loadout. The modified
 * loadout must be a new instance (immutable updates). These functions can be
 * used in reducers or passed directly to a `setLoadout` function.
 *
 * @example
 *
 * function addItem(defs, item): LoadoutUpdateFunction {
 *   return (loadout) => {
 *     ...
 *   }
 * }
 *
 * setLoadout(addItem(defs, item))
 */
export type LoadoutUpdateFunction = (loadout: Loadout) => Loadout;

/** Some helpers that bind our updater functions to the current environment */
export function useLoadoutUpdaters(
  store: DimStore,
  setLoadout: (updater: LoadoutUpdateFunction) => void,
) {
  const defs = useD2Definitions()!;

  function useUpdater<T extends unknown[]>(fn: (...args: T) => LoadoutUpdateFunction) {
    return useCallback((...args: T) => setLoadout(fn(...args)), [fn]);
  }
  function useDefsUpdater<T extends unknown[]>(
    fn: (defs: D1ManifestDefinitions | D2ManifestDefinitions, ...args: T) => LoadoutUpdateFunction,
  ) {
    // exhaustive-deps wants us to remove the dependency on defs, but we really do need it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useCallback((...args: T) => setLoadout(fn(defs, ...args)), [fn, defs]);
  }
  function useDefsStoreUpdater<T extends unknown[]>(
    fn: (
      defs: D1ManifestDefinitions | D2ManifestDefinitions,
      store: DimStore,
      ...args: T
    ) => LoadoutUpdateFunction,
  ) {
    // exhaustive-deps wants us to remove the dependency on defs and store, but we really do need it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useCallback((...args: T) => setLoadout(fn(defs, store, ...args)), [fn, defs, store]);
  }

  return { useUpdater, useDefsUpdater, useDefsStoreUpdater };
}

/**
 * Produce a new loadout that adds a new item to the given loadout.
 */
export function addItem(
  defs: D2ManifestDefinitions | D1ManifestDefinitions,
  item: DimItem,
  equip?: boolean,
  socketOverrides?: SocketOverrides,
): LoadoutUpdateFunction {
  return produce((draftLoadout) => {
    const loadoutItem = convertToLoadoutItem(item, false);
    if (socketOverrides) {
      loadoutItem.socketOverrides = socketOverrides;
    }
    if (item.sockets && item.bucket.hash === BucketHashes.Subclass && !socketOverrides) {
      loadoutItem.socketOverrides = createSocketOverridesFromEquipped(item);
    }

    // We only allow one subclass, and it must be equipped. Same with a couple other things.
    const singular = singularBucketHashes.includes(item.bucket.hash);
    const maxSlots = singular ? 1 : item.bucket.capacity;

    if (!itemCanBeInLoadout(item)) {
      showNotification({ type: 'warning', title: t('Loadouts.OnlyItems') });
      return;
    }

    if (!isItemLoadoutCompatible(item.classType, draftLoadout.classType)) {
      showNotification({
        type: 'warning',
        title: t('Loadouts.ClassTypeMismatch', { className: item.classTypeNameLocalized }),
      });
      return;
    }

    const dupeIndex = findSameLoadoutItemIndex(defs, draftLoadout.items, item);
    if (dupeIndex !== -1) {
      const dupe = draftLoadout.items[dupeIndex];
      if (item.maxStackSize > 1) {
        // The item is already here but we'd like to add more of it (only D1 loadouts hold stackables)
        loadoutItem.amount += Math.min(dupe.amount + item.amount, item.maxStackSize);
      }
      // Remove the dupe, we'll replace it with the new item
      draftLoadout.items.splice(dupeIndex, 1);
    }

    const typeInventory = loadoutItemsInBucket(defs, draftLoadout, item.bucket.hash);
    if (dupeIndex === -1 && typeInventory.length >= maxSlots && !singular) {
      // We're already full
      errorLog('loadouts', "Can't add", item);
      showNotification({
        type: 'warning',
        title: t('Loadouts.MaxSlots', { slots: maxSlots, bucketName: item.bucket.name }),
      });
      return;
    }

    // Set equip based on either explicit argument, or if it's the first item of this type
    loadoutItem.equip = equip !== undefined ? equip : item.equipment && typeInventory.length === 0;
    // Reset all other items of this type to not be equipped
    if (loadoutItem.equip) {
      unequipOtherItems(defs, item, draftLoadout);
    }

    if (singular) {
      // Remove all others (there really should be at most one) and force equipped
      draftLoadout.items = draftLoadout.items.filter((li) => !typeInventory.includes(li));
      loadoutItem.equip = true;
    }

    draftLoadout.items.push(loadoutItem);

    // If adding a new armor item, remove any fashion mods (shader/ornament) that couldn't be slotted
    if (
      item.bucket.inArmor &&
      loadoutItem.equip &&
      draftLoadout.parameters?.modsByBucket?.[item.bucket.hash]?.length
    ) {
      const cosmeticSockets = getSocketsByCategoryHash(
        item.sockets,
        SocketCategoryHashes.ArmorCosmetics,
      );
      draftLoadout.parameters.modsByBucket[item.bucket.hash] = draftLoadout.parameters.modsByBucket[
        item.bucket.hash
      ].filter((plugHash) =>
        cosmeticSockets.some((s) => s.plugSet?.plugs.some((p) => p.plugDef.hash === plugHash)),
      );
    }
  });
}

/**
 * Produce a new Loadout with the given item removed from the original loadout.
 */
export function removeItem(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  { item, loadoutItem: searchLoadoutItem }: ResolvedLoadoutItem,
): LoadoutUpdateFunction {
  return produce((draftLoadout) => {
    // TODO: it might be nice if we just assigned a unique ID to every loadout item just for in-memory ops like deleting
    // We can't just look it up by identity since Immer wraps objects in a proxy and getItemsFromLoadoutItems
    // changes the socketOverrides, so simply search by unmodified ID and hash.
    const loadoutItemIndex = draftLoadout.items.findIndex(
      (i) => i.hash === searchLoadoutItem.hash && i.id === searchLoadoutItem.id,
    );

    if (loadoutItemIndex === -1) {
      return;
    }
    const loadoutItem = draftLoadout.items[loadoutItemIndex];

    loadoutItem.amount ||= 1;
    loadoutItem.amount--;
    if (loadoutItem.amount <= 0) {
      draftLoadout.items.splice(loadoutItemIndex, 1);
    }

    // If we removed an equipped item, equip the first unequipped item
    if (loadoutItem.equip) {
      const bucketHash = item.bucket.hash;
      const typeInventory = bucketHash ? loadoutItemsInBucket(defs, draftLoadout, bucketHash) : [];
      // Here we can use identity because typeInventory is all proxies
      const nextInLine =
        typeInventory.length > 0 && draftLoadout.items.find((i) => i === typeInventory[0]);
      if (nextInLine) {
        nextInLine.equip = true;
      }
    }
  });
}

/**
 * Replace an existing item in the loadout (likely a missing item) with a new
 * item. It should inherit equipped-ness from the original item.
 */
export function replaceItem(
  { loadoutItem }: ResolvedLoadoutItem,
  newItem: DimItem,
): LoadoutUpdateFunction {
  return produce((draftLoadout) => {
    const newLoadoutItem = convertToLoadoutItem(newItem, loadoutItem.equip);
    const loadoutItemIndex = draftLoadout.items.findIndex(
      (i) => i.hash === loadoutItem.hash && i.id === loadoutItem.id,
    );
    if (loadoutItemIndex === -1) {
      throw new Error('Original item to replace not found');
    }

    draftLoadout.items[loadoutItemIndex] = newLoadoutItem;
  });
}

/**
 * When setting an item to be equipped, this function resets other items to not
 * be equipped to prevent multiple equipped items in the same bucket, and
 * multiple equipped exotics.
 */
function unequipOtherItems(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  item: DimItem,
  draftLoadout: Draft<Loadout>,
) {
  for (const li of draftLoadout.items) {
    const itemDef = defs.InventoryItem.get(li.hash);
    const bucketHash = getBucketHashFromItemHash(defs, li.hash);

    const equippingLabel =
      itemDef && 'tierType' in itemDef
        ? itemDef.tierType === TierType.Exotic
          ? itemDef.itemType.toString()
          : undefined
        : itemDef.equippingBlock?.uniqueLabel;

    // Others in this slot
    if (
      bucketHash === item.bucket.hash ||
      // Other exotics
      (item.equippingLabel && equippingLabel === item.equippingLabel)
    ) {
      li.equip = false;
    }
  }
}

/**
 * Produce a new loadout with the given item switched to being equipped (or unequipped if it's already equipped).
 */
export function toggleEquipped(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  { item, loadoutItem: { equip, socketOverrides } }: ResolvedLoadoutItem,
): LoadoutUpdateFunction {
  return addItem(defs, item, !equip, socketOverrides);
}

export function applySocketOverrides(
  { loadoutItem: searchLoadoutItem }: ResolvedLoadoutItem,
  socketOverrides: SocketOverrides | undefined,
): LoadoutUpdateFunction {
  return produce((draftLoadout) => {
    // TODO: it might be nice if we just assigned a unique ID to every loadout item just for in-memory ops like deleting
    // We can't just look it up by identity since Immer wraps objects in a proxy and getItemsFromLoadoutItems
    // changes the socketOverrides, so simply search by unmodified ID and hash.
    const loadoutItem = draftLoadout.items.find(
      (li) => li.id === searchLoadoutItem.id && li.hash === searchLoadoutItem.hash,
    );
    if (loadoutItem) {
      loadoutItem.socketOverrides = socketOverrides;
    }
  });
}

function loadoutItemsInBucket(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  loadout: Loadout,
  searchBucketHash: number,
) {
  return loadout.items.filter((li) => {
    const bucketHash = getBucketHashFromItemHash(defs, li.hash);
    return bucketHash && bucketHash === searchBucketHash;
  });
}

function getBucketHashFromItemHash(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  itemHash: number,
) {
  const def = defs.InventoryItem.get(itemHash);
  return def && ('bucketTypeHash' in def ? def.bucketTypeHash : def.inventory?.bucketTypeHash);
}

/**
 * Remove all Loadout Optimizer parameters from a loadout. This leaves things like mods and fashion in place.
 */
export function clearLoadoutOptimizerParameters(): LoadoutUpdateFunction {
  return produce((draft) => {
    if (draft.parameters) {
      delete draft.parameters.assumeArmorMasterwork;
      delete draft.parameters.exoticArmorHash;
      delete draft.parameters.query;
      delete draft.parameters.statConstraints;
      delete draft.parameters.autoStatMods;
    }
  });
}

/** Remove the current subclass from the loadout. */
export function clearSubclass(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
): LoadoutUpdateFunction {
  return (loadout) => {
    if (!defs.isDestiny2) {
      return loadout;
    }

    const isSubclass = (i: LoadoutItem) =>
      defs.InventoryItem.get(i.hash)?.inventory?.bucketTypeHash === BucketHashes.Subclass;

    return {
      ...loadout,
      items: loadout.items.filter((i) => !isSubclass(i)),
    };
  };
}

/**
 * Remove a specific mod by its inventory item hash.
 */
export function removeMod(mod: ResolvedLoadoutMod): LoadoutUpdateFunction {
  return (loadout) => {
    if (loadout.parameters?.mods) {
      const index = loadout.parameters?.mods.indexOf(mod.originalModHash);
      if (index !== -1) {
        const mods = loadout.parameters.mods.toSpliced(index, 1);
        return setLoadoutParameters({ mods })(loadout);
      }
    }
    return loadout;
  };
}

/** Replace the loadout's subclass with the store's currently equipped subclass */
export function setLoadoutSubclassFromEquipped(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  store: DimStore,
): LoadoutUpdateFunction {
  return (loadout) => {
    const newSubclass = store.items.find(
      (item) =>
        item.equipped && item.bucket.hash === BucketHashes.Subclass && itemCanBeInLoadout(item),
    );

    if (!newSubclass || !defs.isDestiny2) {
      return loadout;
    }

    return addItem(defs, newSubclass, true)(loadout);
  };
}

/**
 * Fill in items from the store's equipped items, keeping any equipped items already in the loadout in place.
 */
export function fillLoadoutFromEquipped(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  store: DimStore,
  artifactUnlocks: LoadoutParameters['artifactUnlocks'] | undefined,
  /** Fill in from only this specific category */
  category?: D2BucketCategory,
): LoadoutUpdateFunction {
  return (loadout) => {
    const equippedItemsByBucket = _.keyBy(
      loadout.items.filter((li) => li.equip),
      (li) => getBucketHashFromItemHash(defs, li.hash),
    );

    const newEquippedItems = store.items.filter(
      (item) => item.equipped && itemCanBeInLoadout(item) && itemMatchesCategory(item, category),
    );
    const modsByBucket: { [bucketHash: number]: number[] } = {};
    for (const item of newEquippedItems) {
      if (!(item.bucket.hash in equippedItemsByBucket)) {
        loadout = addItem(defs, item, true)(loadout);

        // Only save fashion for the items we added
        const plugs = item.sockets
          ? filterMap(
              getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorCosmetics),
              (s) => s.plugged?.plugDef.hash,
            )
          : [];
        if (plugs.length) {
          modsByBucket[item.bucket.hash] = plugs;
        }
      }
    }

    // Populate mods if they aren't already there
    if (!category && _.isEmpty(loadout.parameters?.mods)) {
      loadout = syncModsFromEquipped(store)(loadout);
    }

    // Populate artifactUnlocks if they aren't already there
    if (!category && _.isEmpty(loadout.parameters?.artifactUnlocks)) {
      loadout = syncArtifactUnlocksFromEquipped(artifactUnlocks)(loadout);
    }

    // Save "fashion" mods for newly equipped items, but don't overwrite existing fashion
    if (!_.isEmpty(modsByBucket)) {
      loadout = updateModsByBucket({ ...modsByBucket, ...loadout.parameters?.modsByBucket })(
        loadout,
      );
    }

    return loadout;
  };
}

/**
 * Replace all equipped items from the store's equipped items.
 */
export function syncLoadoutCategoryFromEquipped(
  defs: D2ManifestDefinitions | D1ManifestDefinitions,
  store: DimStore,
  category: D2BucketCategory,
): LoadoutUpdateFunction {
  return (loadout) => {
    const bucketHashes = getLoadoutBucketHashesFromCategory(defs, category);

    // Remove equipped items from this bucket
    loadout = {
      ...loadout,
      items: loadout.items.filter(
        (li) => !(li.equip && bucketHashes.includes(getBucketHashFromItemHash(defs, li.hash) ?? 0)),
      ),
    };
    const newEquippedItems = store.items.filter(
      (item) =>
        item.equipped && itemCanBeInLoadout(item) && bucketHashes.includes(item.bucket.hash),
    );
    for (const item of newEquippedItems) {
      loadout = addItem(defs, item, true)(loadout);
    }
    // Save "fashion" mods for equipped items
    const modsByBucket: { [bucketHash: number]: number[] } = {};
    for (const item of newEquippedItems.filter((i) => i.bucket.inArmor)) {
      const plugs = item.sockets
        ? filterMap(
            getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorCosmetics),
            (s) => s.plugged?.plugDef.hash,
          )
        : [];
      if (plugs.length) {
        modsByBucket[item.bucket.hash] = plugs;
      }
    }
    if (!_.isEmpty(modsByBucket)) {
      loadout = setLoadoutParameters({ modsByBucket })(loadout);
    }
    return loadout;
  };
}

/**
 * Add all the unequipped items on the given character to the loadout.
 */
export function fillLoadoutFromUnequipped(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  store: DimStore,
  /** Fill in from only this specific category */
  category?: D2BucketCategory,
): LoadoutUpdateFunction {
  return (loadout) => {
    const items = getUnequippedItemsForLoadout(store, category);
    for (const item of items) {
      // Don't mess with something that's already there
      const dupeIndex = findSameLoadoutItemIndex(defs, loadout.items, item);
      if (dupeIndex === -1) {
        // Add as an unequipped item
        loadout = addItem(defs, item, false)(loadout);
      }
    }
    return loadout;
  };
}

export function setName(name: string): LoadoutUpdateFunction {
  return (loadout) => ({
    ...loadout,
    name,
  });
}

export function setNotes(notes: string | undefined): LoadoutUpdateFunction {
  return (loadout) => ({
    ...loadout,
    notes,
  });
}

export function setClassType(classType: DestinyClass): LoadoutUpdateFunction {
  return (loadout) => ({
    ...loadout,
    classType,
  });
}

export function setClearSpace(
  clearSpace: boolean,
  category: 'Weapons' | 'Armor',
): LoadoutUpdateFunction {
  return (loadout) => ({
    ...loadout,
    parameters: {
      ...loadout.parameters,
      [category === 'Weapons' ? 'clearWeapons' : 'clearArmor']: clearSpace,
    },
  });
}

export function setLoadoutParameters(params: Partial<LoadoutParameters>): LoadoutUpdateFunction {
  return (loadout) => ({
    ...loadout,
    parameters: { ...loadout.parameters, ...params },
  });
}

/**
 * Replace the mods in this loadout with all the mods currently on this character's equipped armor.
 */
export function syncModsFromEquipped(store: DimStore): LoadoutUpdateFunction {
  const mods: number[] = [];
  const equippedArmor = store.items.filter(
    (item) => item.equipped && itemCanBeInLoadout(item) && item.bucket.sort === 'Armor',
  );
  for (const item of equippedArmor) {
    mods.push(...extractArmorModHashes(item));
  }

  return updateMods(mods);
}

export function getLoadoutBucketHashesFromCategory(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  category: D2BucketCategory | D1BucketCategory,
) {
  return defs.isDestiny2
    ? category === 'General'
      ? [BucketHashes.Ghost, BucketHashes.Emblems, BucketHashes.Ships, BucketHashes.Vehicle]
      : D2Categories[category as D2BucketCategory]
    : D1Categories[category as D1BucketCategory];
}

export function clearBucketCategory(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  category: D2BucketCategory | D1BucketCategory,
) {
  return clearBuckets(defs, getLoadoutBucketHashesFromCategory(defs, category));
}

/**
 * Remove all items that are in one or more buckets.
 */
function clearBuckets(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  bucketHashes: number[],
): LoadoutUpdateFunction {
  return (loadout) => ({
    ...loadout,
    items: loadout.items.filter((i) => {
      const bucketHash = getBucketHashFromItemHash(defs, i.hash);

      return !(
        bucketHash &&
        // Subclasses are in "general" but shouldn't be cleared when we
        // clear general -- there's an explicit clearSubclass
        bucketHash !== BucketHashes.Subclass &&
        bucketHashes.includes(bucketHash)
      );
    }),
  });
}

export function clearMods(): LoadoutUpdateFunction {
  return produce((loadout) => {
    delete loadout.parameters?.mods;
  });
}

export function changeClearMods(enabled: boolean): LoadoutUpdateFunction {
  return setLoadoutParameters({
    clearMods: enabled,
  });
}

export function changeIncludeRuntimeStats(enabled: boolean): LoadoutUpdateFunction {
  return setLoadoutParameters({
    includeRuntimeStatBenefits: enabled,
  });
}

export function updateMods(mods: number[]): LoadoutUpdateFunction {
  return setLoadoutParameters({
    mods: mods.map(mapToNonReducedModCostVariant),
  });
}

export function updateModsByBucket(
  modsByBucket: { [bucketHash: number]: number[] } | undefined,
): LoadoutUpdateFunction {
  return setLoadoutParameters({
    modsByBucket: _.isEmpty(modsByBucket) ? undefined : modsByBucket,
  });
}

/**
 * Replace the artifact unlocks with the currently equipped ones.
 */
export function syncArtifactUnlocksFromEquipped(
  artifactUnlocks:
    | {
        unlockedItemHashes: number[];
        seasonNumber: number;
      }
    | undefined,
): LoadoutUpdateFunction {
  if (artifactUnlocks?.unlockedItemHashes.length) {
    return setLoadoutParameters({
      artifactUnlocks,
    });
  } else {
    return (loadout) => loadout;
  }
}

/**
 * Clear the artifact unlocks.
 */
export function clearArtifactUnlocks(): LoadoutUpdateFunction {
  return setLoadoutParameters({
    artifactUnlocks: undefined,
  });
}

/**
 * Remove one artifact mod.
 */
export function removeArtifactUnlock(mod: number): LoadoutUpdateFunction {
  return produce((loadout) => {
    if (loadout.parameters?.artifactUnlocks) {
      const index = loadout.parameters?.artifactUnlocks.unlockedItemHashes.indexOf(mod);
      if (index !== -1) {
        loadout.parameters.artifactUnlocks.unlockedItemHashes.splice(index, 1);
      }
    }
  });
}

/** Randomize the subclass and subclass configuration */
export function randomizeLoadoutSubclass(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  store: DimStore,
): LoadoutUpdateFunction {
  return (loadout) => {
    const newSubclass = _.sample(
      store.items.filter(
        (item) => item.bucket.hash === BucketHashes.Subclass && itemCanBeInLoadout(item),
      ),
    );

    if (!newSubclass) {
      return loadout;
    }

    return addItem(
      defs,
      newSubclass,
      true,
      defs.isDestiny2 ? randomSubclassConfiguration(defs, newSubclass) : undefined,
    )(loadout);
  };
}

function itemMatchesCategory(item: DimItem, category: D2BucketCategory | undefined) {
  return category
    ? category === 'General'
      ? item.bucket.hash !== BucketHashes.Subclass && item.bucket.sort === category
      : item.bucket.sort === category
    : fromEquippedTypes.includes(item.bucket.hash);
}

/**
 * Randomize the subclass (+ configuration), items, and mods of the loadout.
 */
export function randomizeFullLoadout(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  store: DimStore,
  allItems: DimItem[],
  itemFilter: ItemFilter | undefined,
  unlockedPlugs: Set<number>,
) {
  return (loadout: Loadout) => {
    loadout = randomizeLoadoutItems(defs, store, allItems, undefined, itemFilter)(loadout);
    return randomizeLoadoutMods(defs, store, allItems, unlockedPlugs)(loadout);
  };
}

/**
 * Randomize the equipped items, filling empty buckets and replacing existing equipped items.
 */
export function randomizeLoadoutItems(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  store: DimStore,
  allItems: DimItem[],
  /** Randomize only this specific category */
  category: D2BucketCategory | undefined,
  itemFilter: ItemFilter | undefined,
): LoadoutUpdateFunction {
  return produce((loadout) => {
    const randomizedLoadout = randomLoadout(
      store,
      allItems,
      (item) =>
        itemMatchesCategory(item, category) &&
        (!(item.bucket.sort === 'Weapons' || item.bucket.sort === 'Armor') ||
          !itemFilter ||
          itemFilter(item)),
    );
    const randomizedLoadoutBuckets = randomizedLoadout.items.map((li) =>
      getBucketHashFromItemHash(defs, li.hash),
    );
    loadout.items = loadout.items.filter(
      (i) =>
        !i.equip || !randomizedLoadoutBuckets.includes(getBucketHashFromItemHash(defs, i.hash)),
    );
    for (const item of randomizedLoadout.items) {
      let loadoutItem = item;
      if (defs.isDestiny2 && getBucketHashFromItemHash(defs, item.hash) === BucketHashes.Subclass) {
        loadoutItem = {
          ...loadoutItem,
          socketOverrides: randomSubclassConfiguration(
            defs,
            allItems.find((dimItem) => dimItem.hash === item.hash)!,
          ),
        };
      }
      loadout.items.push(loadoutItem);
    }
  });
}

/**
 * Replace the loadout's mods with randomly chosen mods that will fit on the
 * loadout's equipped armor (falling back to character-equipped items).
 */
export function randomizeLoadoutMods(
  defs: D2ManifestDefinitions | D1ManifestDefinitions,
  store: DimStore,
  allItems: DimItem[],
  unlockedPlugs: Set<number>,
): LoadoutUpdateFunction {
  return produce((loadout) => {
    const equippedArmor = store.items.filter(
      (item) => item.equipped && itemCanBeInLoadout(item) && item.bucket.sort === 'Armor',
    );

    for (const li of loadout.items) {
      const existingItem = findItemForLoadout(defs, allItems, store.id, li);
      if (existingItem?.bucket.sort === 'Armor') {
        const idx = equippedArmor.findIndex(
          (item) => item.bucket.hash === existingItem.bucket.hash,
        );
        equippedArmor[idx] = existingItem;
      }
    }

    const mods = [];
    for (const item of equippedArmor) {
      if (item.sockets) {
        let energy = item.energy?.energyCapacity ?? 0;
        const exclusionGroups: string[] = [];
        const sockets = _.shuffle(
          getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorMods),
        );
        for (const socket of sockets) {
          const chosenMod = _.sample(
            socket.plugSet?.plugs.filter((plug) => {
              if (
                plug.plugDef.hash === socket.emptyPlugItemHash ||
                !unlockedPlugs.has(plug.plugDef.hash)
              ) {
                return false;
              }
              const cost = plug.plugDef.plug.energyCost?.energyCost;
              const exclusionGroup = getModExclusionGroup(plug.plugDef);
              return (
                (cost === undefined || cost <= energy) &&
                (exclusionGroup === undefined || !exclusionGroups.includes(exclusionGroup))
              );
            }),
          );
          if (chosenMod) {
            mods.push(mapToNonReducedModCostVariant(chosenMod.plugDef.hash));
            energy -= chosenMod.plugDef.plug.energyCost?.energyCost ?? 0;
            const exclusionGroup = getModExclusionGroup(chosenMod.plugDef);
            if (exclusionGroup !== undefined) {
              exclusionGroups.push(exclusionGroup);
            }
          }
        }
      }
    }

    return setLoadoutParameters({
      mods,
    })(loadout);
  });
}
