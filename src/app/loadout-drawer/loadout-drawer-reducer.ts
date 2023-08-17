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
import { showNotification } from 'app/notifications/notifications';
import { ItemFilter } from 'app/search/filter-types';
import { isClassCompatible, itemCanBeInLoadout } from 'app/utils/item-utils';
import { errorLog } from 'app/utils/log';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { filterMap } from 'app/utils/util';
import { DestinyClass, TierType } from 'bungie-api-ts/destiny2';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import { Draft, produce } from 'immer';
import _ from 'lodash';
import { randomLoadout, randomSubclassConfiguration } from './auto-loadouts';
import { Loadout, LoadoutItem, ResolvedLoadoutItem, ResolvedLoadoutMod } from './loadout-types';
import {
  convertToLoadoutItem,
  createSocketOverridesFromEquipped,
  createSubclassDefaultSocketOverrides,
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

/**
 * Produce a new loadout that adds a new item to the given loadout.
 */
export function addItem(
  defs: D2ManifestDefinitions | D1ManifestDefinitions,
  item: DimItem,
  equip?: boolean,
  socketOverrides?: SocketOverrides
): LoadoutUpdateFunction {
  return produce((draftLoadout) => {
    const loadoutItem = convertToLoadoutItem(item, false, 1);
    if (item.sockets && item.bucket.hash === BucketHashes.Subclass) {
      loadoutItem.socketOverrides = socketOverrides ?? createSubclassDefaultSocketOverrides(item);
    }

    // We only allow one subclass, and it must be equipped. Same with a couple other things.
    const singular = singularBucketHashes.includes(item.bucket.hash);
    const maxSlots = singular ? 1 : item.bucket.capacity;

    if (!itemCanBeInLoadout(item)) {
      showNotification({ type: 'warning', title: t('Loadouts.OnlyItems') });
      return;
    }

    if (!isClassCompatible(item.classType, draftLoadout.classType)) {
      showNotification({
        type: 'warning',
        title: t('Loadouts.ClassTypeMismatch', { className: item.classTypeNameLocalized }),
      });
      return;
    }

    const dupeIndex = findSameLoadoutItemIndex(defs, draftLoadout.items, loadoutItem);
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
      for (const otherItem of typeInventory) {
        otherItem.equip = false;
      }
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
        SocketCategoryHashes.ArmorCosmetics
      );
      draftLoadout.parameters.modsByBucket[item.bucket.hash] = draftLoadout.parameters.modsByBucket[
        item.bucket.hash
      ].filter((plugHash) =>
        cosmeticSockets.some((s) => s.plugSet?.plugs.some((p) => p.plugDef.hash === plugHash))
      );
    }
  });
}

/**
 * Defines the multilayered functionality for dropping an item in the loadout drawer.
 *
 * It does the following
 * 1. If the item is a subclass, it clears the currently selected subclass.
 *
 */
export function dropItem(
  defs: D2ManifestDefinitions | D1ManifestDefinitions,
  item: DimItem,
  equip?: boolean
): LoadoutUpdateFunction {
  return produce((draftLoadout) => {
    if (item.bucket.hash === BucketHashes.Subclass) {
      draftLoadout = clearSubclass(defs)(draftLoadout);
    }

    const loadoutItemIndex = findSameLoadoutItemIndex(
      defs,
      draftLoadout.items,
      convertToLoadoutItem(item, false, 1)
    );

    if (loadoutItemIndex !== -1) {
      setEquipForItemInLoadout(defs, item, draftLoadout, Boolean(equip));
    } else {
      draftLoadout = addItem(defs, item, equip)(draftLoadout);
    }
    return draftLoadout;
  });
}

/**
 * Produce a new Loadout with the given item removed from the original loadout.
 */
export function removeItem(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  { item, loadoutItem: searchLoadoutItem }: ResolvedLoadoutItem
): LoadoutUpdateFunction {
  return produce((draftLoadout) => {
    // TODO: it might be nice if we just assigned a unique ID to every loadout item just for in-memory ops like deleting
    // We can't just look it up by identity since Immer wraps objects in a proxy and getItemsFromLoadoutItems
    // changes the socketOverrides, so simply search by unmodified ID and hash.
    const loadoutItemIndex = draftLoadout.items.findIndex(
      (i) => i.hash === searchLoadoutItem.hash && i.id === searchLoadoutItem.id
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
 * Sets the equipped status for the item, with the value from the equip parameter.
 *
 * This does more than just set the value of the item. It also does the following for the cases when
 * an item is being set as being equipped,
 * 1. Unequips all other items in the same bucket if equipping the item
 * 2. If the item is an exotic, it will unequip other exotics with the same item type as unequipped.
 *
 * @param isEquipped The desired `equip` value for the passed in item in the draftLoadout.
 */
function setEquipForItemInLoadout(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  item: DimItem,
  draftLoadout: Draft<Loadout>,
  isEquipped: boolean
) {
  // Subclasses and some others are always equipped
  if (singularBucketHashes.includes(item.bucket.hash)) {
    return;
  }

  // TODO: it might be nice if we just assigned a unique ID to every loadout item just for in-memory ops like deleting
  // We can't just look it up by identity since Immer wraps objects in a proxy and getItemsFromLoadoutItems
  // changes the socketOverrides, so simply search by unmodified ID and hash.
  const loadoutItemIndex = findSameLoadoutItemIndex(
    defs,
    draftLoadout.items,
    convertToLoadoutItem(item, false, 1)
  );

  if (loadoutItemIndex === -1) {
    return;
  }
  const loadoutItem = draftLoadout.items[loadoutItemIndex];

  if (item.equipment) {
    if (!isEquipped) {
      // It's equipped, mark it unequipped
      loadoutItem.equip = false;
    } else {
      // It's unequipped - mark all the other items in the same bucket, and conflicting exotics, as unequipped, then mark this equipped
      for (const li of draftLoadout.items) {
        const itemDef = defs.InventoryItem.get(li.hash);
        const bucketHash =
          itemDef &&
          ('bucketTypeHash' in itemDef
            ? itemDef.bucketTypeHash
            : itemDef.inventory?.bucketTypeHash);

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
      loadoutItem.equip = true;
    }
  }
}

/**
 * Produce a new loadout with the given item switched to being equipped (or unequipped if it's already equipped).
 */
export function equipItem(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  resolvedItem: ResolvedLoadoutItem
): LoadoutUpdateFunction {
  return produce((draftLoadout) => {
    setEquipForItemInLoadout(
      defs,
      resolvedItem.item,
      draftLoadout,
      !resolvedItem.loadoutItem.equip
    );
  });
}

export function applySocketOverrides(
  { loadoutItem: searchLoadoutItem }: ResolvedLoadoutItem,
  socketOverrides: SocketOverrides | undefined
): LoadoutUpdateFunction {
  return produce((draftLoadout) => {
    // TODO: it might be nice if we just assigned a unique ID to every loadout item just for in-memory ops like deleting
    // We can't just look it up by identity since Immer wraps objects in a proxy and getItemsFromLoadoutItems
    // changes the socketOverrides, so simply search by unmodified ID and hash.
    const loadoutItem = draftLoadout.items.find(
      (li) => li.id === searchLoadoutItem.id && li.hash === searchLoadoutItem.hash
    );
    if (loadoutItem) {
      loadoutItem.socketOverrides = socketOverrides;
    }
  });
}

function loadoutItemsInBucket(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  loadout: Loadout,
  searchBucketHash: number
) {
  return loadout.items.filter((li) => {
    const bucketHash = getBucketHashFromItemHash(defs, li.hash);
    return bucketHash && bucketHash === searchBucketHash;
  });
}

function getBucketHashFromItemHash(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  itemHash: number
) {
  const def = defs.InventoryItem.get(itemHash);
  return def && ('bucketTypeHash' in def ? def.bucketTypeHash : def.inventory?.bucketTypeHash);
}

/**
 * Remove all Loadout Optimizer parameters from a loadout. This leaves things like mods and fashion in place.
 */
export function clearLoadoutParameters(): LoadoutUpdateFunction {
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
  defs: D1ManifestDefinitions | D2ManifestDefinitions
): LoadoutUpdateFunction {
  return (loadout) => {
    if (!defs.isDestiny2()) {
      return loadout;
    }

    const isSubclass = (i: LoadoutItem) =>
      defs.InventoryItem.get(i.hash)?.inventory?.bucketTypeHash === BucketHashes.Subclass;

    return {
      ...loadout,
      items: [...loadout.items.filter((i) => !isSubclass(i))],
    };
  };
}

/**
 * Remove a specific mod by its inventory item hash.
 */
export function removeMod(mod: ResolvedLoadoutMod): LoadoutUpdateFunction {
  return produce((loadout) => {
    if (loadout.autoStatMods) {
      const index = loadout.autoStatMods.indexOf(mod.originalModHash);
      if (index !== -1) {
        loadout.autoStatMods.splice(index, 1);
        return;
      }
    }

    if (loadout.parameters?.mods) {
      const index = loadout.parameters?.mods.indexOf(mod.originalModHash);
      if (index !== -1) {
        loadout.parameters.mods.splice(index, 1);
        return;
      }
    }
  });
}

/** Replace the loadout's subclass with the store's currently equipped subclass */
export function setLoadoutSubclassFromEquipped(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  store: DimStore
): LoadoutUpdateFunction {
  return (loadout) => {
    const newSubclass = store.items.find(
      (item) =>
        item.equipped && item.bucket.hash === BucketHashes.Subclass && itemCanBeInLoadout(item)
    );

    if (!newSubclass || !defs.isDestiny2()) {
      return loadout;
    }

    return addItem(
      defs,
      newSubclass,
      true,
      createSocketOverridesFromEquipped(newSubclass)
    )(loadout);
  };
}

/**
 * Fill in items from the store's equipped items, keeping any equipped items already in the loadout in place.
 */
export function fillLoadoutFromEquipped(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  store: DimStore,
  artifactUnlocks?: LoadoutParameters['artifactUnlocks'],
  /** Fill in from only this specific category */
  category?: D2BucketCategory
): LoadoutUpdateFunction {
  return produce((loadout) => {
    const equippedItemsByBucket = _.keyBy(
      loadout.items.filter((li) => li.equip),
      (li) => getBucketHashFromItemHash(defs, li.hash)
    );

    const newEquippedItems = store.items.filter(
      (item) => item.equipped && itemCanBeInLoadout(item) && itemMatchesCategory(item, category)
    );
    const mods: number[] = [];
    for (const item of newEquippedItems) {
      if (!(item.bucket.hash in equippedItemsByBucket)) {
        const loadoutItem = convertToLoadoutItem(item, true, 1);
        if (item.bucket.hash === BucketHashes.Subclass) {
          loadoutItem.socketOverrides = createSocketOverridesFromEquipped(item);
        }
        loadout.items.push(loadoutItem);
        mods.push(...extractArmorModHashes(item).map(mapToNonReducedModCostVariant));
      }
    }
    if (mods.length && (loadout.parameters?.mods ?? []).length === 0) {
      loadout.parameters = {
        ...loadout.parameters,
        mods,
      };
    }
    if (artifactUnlocks?.unlockedItemHashes.length) {
      loadout.parameters = {
        ...loadout.parameters,
        artifactUnlocks,
      };
    }
    // Save "fashion" mods for equipped items
    const modsByBucket: { [bucketHash: number]: number[] } = {};
    for (const item of newEquippedItems.filter((i) => i.bucket.inArmor)) {
      const plugs = item.sockets
        ? filterMap(
            getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorCosmetics),
            (s) => s.plugged?.plugDef.hash
          )
        : [];
      if (plugs.length) {
        modsByBucket[item.bucket.hash] = plugs;
      }
    }
    if (!_.isEmpty(modsByBucket)) {
      loadout.parameters = {
        ...loadout.parameters,
        modsByBucket,
      };
    }
  });
}

/**
 * Add all the unequipped items on the given character to the loadout.
 */
export function fillLoadoutFromUnequipped(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  store: DimStore,
  /** Fill in from only this specific category */
  category?: D2BucketCategory
): LoadoutUpdateFunction {
  return (loadout) => {
    const items = getUnequippedItemsForLoadout(store, category);
    // TODO: batch addItems
    for (const item of items) {
      // Add as an unequipped item
      loadout = addItem(defs, item, false)(loadout);
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
  category: 'Weapons' | 'Armor'
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
    (item) => item.equipped && itemCanBeInLoadout(item) && item.bucket.sort === 'Armor'
  );
  for (const item of equippedArmor) {
    mods.push(...extractArmorModHashes(item).map(mapToNonReducedModCostVariant));
  }

  return setLoadoutParameters({
    mods,
  });
}

export function clearBucketCategory(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  category: D2BucketCategory | D1BucketCategory
) {
  return clearBuckets(
    defs,
    defs.isDestiny2()
      ? D2Categories[category as D2BucketCategory]
      : D1Categories[category as D1BucketCategory]
  );
}

/**
 * Remove all items that are in one or more buckets.
 */
function clearBuckets(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  bucketHashes: number[]
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
    delete loadout.autoStatMods;
  });
}

export function changeClearMods(enabled: boolean): LoadoutUpdateFunction {
  return setLoadoutParameters({
    clearMods: enabled,
  });
}

export function updateMods(mods: number[]): LoadoutUpdateFunction {
  return setLoadoutParameters({
    mods: mods.map(mapToNonReducedModCostVariant),
  });
}

export function updateModsByBucket(
  modsByBucket: { [bucketHash: number]: number[] } | undefined
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
    | undefined
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
  store: DimStore
): LoadoutUpdateFunction {
  return (loadout) => {
    const newSubclass = _.sample(
      store.items.filter(
        (item) => item.bucket.hash === BucketHashes.Subclass && itemCanBeInLoadout(item)
      )
    );

    if (!newSubclass) {
      return loadout;
    }

    return addItem(
      defs,
      newSubclass,
      true,
      defs.isDestiny2() ? randomSubclassConfiguration(defs, newSubclass) : undefined
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
  unlockedPlugs: Set<number>
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
  itemFilter: ItemFilter | undefined
): LoadoutUpdateFunction {
  return produce((loadout) => {
    const randomizedLoadout = randomLoadout(
      store,
      allItems,
      (item) =>
        itemMatchesCategory(item, category) &&
        (!(item.bucket.sort === 'Weapons' || item.bucket.sort === 'Armor') ||
          !itemFilter ||
          itemFilter(item))
    );
    const randomizedLoadoutBuckets = randomizedLoadout.items.map((li) =>
      getBucketHashFromItemHash(defs, li.hash)
    );
    loadout.items = loadout.items.filter(
      (i) => !i.equip || !randomizedLoadoutBuckets.includes(getBucketHashFromItemHash(defs, i.hash))
    );
    for (const item of randomizedLoadout.items) {
      let loadoutItem = item;
      if (
        defs.isDestiny2() &&
        getBucketHashFromItemHash(defs, item.hash) === BucketHashes.Subclass
      ) {
        loadoutItem = {
          ...loadoutItem,
          socketOverrides: randomSubclassConfiguration(
            defs,
            allItems.find((dimItem) => dimItem.hash === item.hash)!
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
  unlockedPlugs: Set<number>
): LoadoutUpdateFunction {
  return produce((loadout) => {
    const equippedArmor = store.items.filter(
      (item) => item.equipped && itemCanBeInLoadout(item) && item.bucket.sort === 'Armor'
    );

    for (const li of loadout.items) {
      const existingItem = findItemForLoadout(defs, allItems, store.id, li);
      if (existingItem?.bucket.sort === 'Armor') {
        const idx = equippedArmor.findIndex(
          (item) => item.bucket.hash === existingItem.bucket.hash
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
          getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorMods)
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
            })
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
