import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { D1Categories } from 'app/destiny1/d1-bucket-categories';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { showNotification } from 'app/notifications/notifications';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyClass, TierType } from 'bungie-api-ts/destiny2';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import produce from 'immer';
import _ from 'lodash';
import { Loadout, LoadoutItem, ResolvedLoadoutItem } from './loadout-types';
import {
  createSocketOverridesFromEquipped,
  extractArmorModHashes,
  fromEquippedTypes,
  getUnequippedItemsForLoadout,
  singularBucketHashes,
} from './loadout-utils';

// TODO: should this really be a reducer, or just a series of functions that produce a new loadout coupled w/ a setLoadout function? General loadout manipulation library would be useful...
// Each function should return a (loadout: Loadout) => Loadout

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
 * Example:
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

export interface State {
  loadout: Readonly<Loadout>;
}

export type Action =
  /** Add an item to the loadout */
  | {
      type: 'addItem';
      item: DimItem;
      /**
       * True or false if the item should definitely be equipped or not
       * equipped, undefined to accept a default based on what's already there
       */
      equip?: boolean;
      socketOverrides?: SocketOverrides;
    }
  // | { type: 'replaceItem' } // add+remove? remove+add? doesn't need to respect type limits?
  /** Applies socket overrides to the supplied item */
  | {
      type: 'applySocketOverrides';
      resolvedItem: ResolvedLoadoutItem;
      socketOverrides: SocketOverrides;
    }
  | { type: 'updateModsByBucket'; modsByBucket: LoadoutParameters['modsByBucket'] }
  /** Remove an item from the loadout */
  | { type: 'removeItem'; resolvedItem: ResolvedLoadoutItem }
  /** Make an item that's already in the loadout equipped */
  | { type: 'equipItem'; resolvedItem: ResolvedLoadoutItem }
  | { type: 'updateMods'; mods: number[] }
  | { type: 'changeClearMods'; enabled: boolean }
  | { type: 'removeMod'; hash: number }
  | { type: 'clearLoadoutParameters' }
  | { type: 'clearMods' }
  | { type: 'setLoadoutSubclassFromEquipped'; store: DimStore }
  | { type: 'fillLoadoutFromEquipped'; store: DimStore; category?: string }
  | { type: 'fillLoadoutFromUnequipped'; store: DimStore; category?: string }
  | { type: 'setNotes'; notes: string | undefined }
  | { type: 'setName'; name: string }
  | { type: 'setClassType'; classType: DestinyClass }
  | { type: 'setClearSpace'; clearSpace: boolean }
  | { type: 'clearCategory'; category: string }
  | { type: 'clearSubclass' }
  | { type: 'syncModsFromEquipped'; store: DimStore };

/**
 * All state for this component is managed through this reducer and the Actions above.
 */
export function stateReducer(defs: D2ManifestDefinitions | D1ManifestDefinitions) {
  return (state: State, action: Action): State => {
    const setLoadout = (updater: LoadoutUpdateFunction) => ({
      ...state,
      loadout: updater(state.loadout),
    });

    switch (action.type) {
      case 'addItem': {
        const { loadout } = state;
        const { item, equip, socketOverrides } = action;

        if (!itemCanBeInLoadout(item)) {
          showNotification({ type: 'warning', title: t('Loadouts.OnlyItems') });
          return state;
        }

        if (item.classType !== DestinyClass.Unknown && loadout.classType !== item.classType) {
          showNotification({
            type: 'warning',
            title: t('Loadouts.ClassTypeMismatch', { className: item.classTypeNameLocalized }),
          });
          return state;
        }
        return setLoadout(addItem(defs, item, equip, socketOverrides));
      }

      case 'removeItem':
        return setLoadout(removeItem(defs, action.resolvedItem));

      case 'equipItem':
        return setLoadout(equipItem(defs, action.resolvedItem));

      case 'applySocketOverrides':
        return setLoadout(applySocketOverrides(action.resolvedItem, action.socketOverrides));

      case 'updateModsByBucket':
        return setLoadout(updateModsByBucket(action.modsByBucket));

      case 'updateMods':
        return setLoadout(updateMods(action.mods));

      case 'changeClearMods':
        return setLoadout(changeClearMods(action.enabled));

      case 'removeMod':
        return setLoadout(removeMod(action.hash));

      case 'clearLoadoutParameters':
        return setLoadout(clearLoadoutParameters());

      case 'setLoadoutSubclassFromEquipped': {
        if (!defs.isDestiny2()) {
          return state;
        }
        return setLoadout(setLoadoutSubclassFromEquipped(defs, action.store));
      }

      case 'fillLoadoutFromEquipped':
        return setLoadout(fillLoadoutFromEquipped(defs, action.store, action.category));

      case 'fillLoadoutFromUnequipped':
        return setLoadout(fillLoadoutFromUnequipped(defs, action.store, action.category));

      case 'setNotes':
        return setLoadout(setNotes(action.notes));

      case 'setClassType':
        return setLoadout(setClassType(action.classType));

      case 'setClearSpace':
        return setLoadout(setClearSpace(action.clearSpace));

      case 'setName':
        return setLoadout(setName(action.name));

      case 'clearSubclass': {
        if (!defs.isDestiny2()) {
          return state;
        }
        return setLoadout(clearSubclass(defs));
      }

      case 'syncModsFromEquipped':
        return setLoadout(syncModsFromEquipped(action.store));

      case 'clearCategory':
        return setLoadout(clearBucketCategory(defs, action.category));

      case 'clearMods':
        return setLoadout(clearMods());
    }
  };
}

/**
 * Produce a new loadout that adds a new item to the given loadout.
 */
export function addItem(
  defs: D2ManifestDefinitions | D1ManifestDefinitions,
  item: DimItem,
  equip?: boolean,
  socketOverrides?: SocketOverrides
): LoadoutUpdateFunction {
  const loadoutItem: LoadoutItem = {
    id: item.id,
    hash: item.hash,
    amount: 1,
    equip: false,
  };
  if (socketOverrides) {
    loadoutItem.socketOverrides = socketOverrides;
  }

  // TODO: We really want to be operating against the resolved items, right? Should we re-resolve them here, or what?
  //       If we don't, we may not properly detect a dupe?

  // We only allow one subclass, and it must be equipped. Same with a couple other things.
  const singular = singularBucketHashes.includes(item.bucket.hash);
  const maxSlots = singular ? 1 : item.bucket.capacity;

  return produce((draftLoadout) => {
    // If this item is already in the loadout, find it via its id/hash.
    const dupe = draftLoadout.items.find((i) => i.hash === item.hash && i.id === item.id);
    if (dupe) {
      if (item.maxStackSize > 1) {
        // The item is already here but we'd like to add more of it (only D1 loadouts hold stackables)
        const increment = Math.min(dupe.amount + item.amount, item.maxStackSize) - dupe.amount;
        dupe.amount += increment;
      }
      // Otherwise just bail and don't modify the loadout
      return;
    }

    const typeInventory = loadoutItemsInBucket(defs, draftLoadout, item.bucket.hash);

    if (typeInventory.length >= maxSlots) {
      // We're already full
      showNotification({
        type: 'warning',
        title: t('Loadouts.MaxSlots', { slots: maxSlots }),
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
 * Produce a new Loadout with the given item removed from the original loadout.
 */
export function removeItem(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  { item, loadoutItem: searchLoadoutItem }: ResolvedLoadoutItem
): LoadoutUpdateFunction {
  return produce((draftLoadout) => {
    // We can't just look it up by identity since Immer wraps objects in a proxy
    // TODO: it might be nice if we just assigned a unique ID to every loadout item just for in-memory ops like deleting
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
 * Produce a new loadout with the given item switched to being equipped (or unequipped if it's already equipped).
 */
export function equipItem(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  { item, loadoutItem: searchLoadoutItem }: ResolvedLoadoutItem
): LoadoutUpdateFunction {
  return produce((draftLoadout) => {
    // Subclasses and some others are always equipped
    if (singularBucketHashes.includes(item.bucket.hash)) {
      return;
    }

    // We can't just look it up by identity since Immer wraps objects in a proxy
    // TODO: it might be nice if we just assigned a unique ID to every loadout item just for in-memory ops like deleting
    const loadoutItemIndex = draftLoadout.items.findIndex(
      (i) => i.hash === searchLoadoutItem.hash && i.id === searchLoadoutItem.id
    );

    if (loadoutItemIndex === -1) {
      return;
    }
    const loadoutItem = draftLoadout.items[loadoutItemIndex];

    if (item.equipment) {
      if (loadoutItem.equip) {
        // It's equipped, mark it unequipped
        loadoutItem.equip = false;
      } else {
        // It's unequipped - mark all the other items in the same bucket, and conflicting exotics, as unequippped unequipped, then mark this equipped
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
  });
}

export function applySocketOverrides(
  { loadoutItem: searchLoadoutItem }: ResolvedLoadoutItem,
  socketOverrides: SocketOverrides
): LoadoutUpdateFunction {
  return produce((draftLoadout) => {
    let loadoutItem = draftLoadout.items.find((li) => li.id === searchLoadoutItem.id);
    // TODO: right now socketOverrides are only really used for subclasses, so we can match by hash
    if (!loadoutItem) {
      loadoutItem = draftLoadout.items.find((li) => li.hash === searchLoadoutItem.hash);
    }
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
      delete draft.parameters.lockArmorEnergyType;
      delete draft.parameters.query;
      delete draft.parameters.statConstraints;
      delete draft.parameters.upgradeSpendTier;
      delete draft.parameters.autoStatMods;
    }
  });
}

/** Remove the current subclass from the loadout. */
export function clearSubclass(defs: D2ManifestDefinitions): LoadoutUpdateFunction {
  return (loadout) => {
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
export function removeMod(hash: number): LoadoutUpdateFunction {
  return (loadout) => {
    const newLoadout = { ...loadout };
    const newMods = newLoadout.parameters?.mods?.length ? [...newLoadout.parameters.mods] : [];
    const index = newMods.indexOf(hash);
    if (index !== -1) {
      newMods.splice(index, 1);
      newLoadout.parameters = {
        ...newLoadout.parameters,
        mods: newMods,
      };
      return newLoadout;
    }
    return loadout;
  };
}

/** Replace the loadout's subclass with the store's currently equipped subclass */
export function setLoadoutSubclassFromEquipped(
  defs: D2ManifestDefinitions,
  store: DimStore
): LoadoutUpdateFunction {
  return (loadout) => {
    const newSubclass = store.items.find(
      (item) =>
        item.equipped && item.bucket.hash === BucketHashes.Subclass && itemCanBeInLoadout(item)
    );

    if (!newSubclass) {
      return loadout;
    }

    const newLoadoutItem: LoadoutItem = {
      id: newSubclass.id,
      hash: newSubclass.hash,
      equip: true,
      amount: 1,
      socketOverrides: createSocketOverridesFromEquipped(newSubclass),
    };

    const isSubclass = (i: LoadoutItem) =>
      defs.InventoryItem.get(i.hash)?.inventory?.bucketTypeHash === BucketHashes.Subclass;

    const newLoadout = {
      ...loadout,
      items: [...loadout.items.filter((i) => !isSubclass(i)), newLoadoutItem],
    };

    return newLoadout;
  };
}

/**
 * Fill in items from the store's equipped items, keeping any equipped items already in the loadout in place.
 */
export function fillLoadoutFromEquipped(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  store: DimStore,
  /** Fill in from only this specific category */
  category?: string
): LoadoutUpdateFunction {
  return produce((loadout) => {
    const equippedItemsByBucket = _.keyBy(
      loadout.items.filter((li) => li.equip),
      (li) => getBucketHashFromItemHash(defs, li.hash)
    );

    const newEquippedItems = store.items.filter(
      (item) =>
        item.equipped &&
        itemCanBeInLoadout(item) &&
        (category
          ? category === 'General'
            ? item.bucket.hash !== BucketHashes.Subclass && item.bucket.sort === category
            : item.bucket.sort === category
          : fromEquippedTypes.includes(item.bucket.hash))
    );
    const mods: number[] = [];
    for (const item of newEquippedItems) {
      if (!(item.bucket.hash in equippedItemsByBucket)) {
        const loadoutItem: LoadoutItem = {
          id: item.id,
          hash: item.hash,
          equip: true,
          amount: 1,
        };
        if (item.bucket.hash === BucketHashes.Subclass) {
          loadoutItem.socketOverrides = createSocketOverridesFromEquipped(item);
        }
        loadout.items.push(loadoutItem);
        mods.push(...extractArmorModHashes(item));
      }
    }
    if (mods.length && (loadout.parameters?.mods ?? []).length === 0) {
      loadout.parameters = {
        ...loadout.parameters,
        mods,
      };
    }
    // Save "fashion" mods for equipped items
    const modsByBucket = {};
    for (const item of newEquippedItems.filter((i) => i.bucket.inArmor)) {
      const plugs = item.sockets
        ? _.compact(
            getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorCosmetics).map(
              (s) => s.plugged?.plugDef.hash
            )
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
  category?: string
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

function setClassType(classType: DestinyClass): LoadoutUpdateFunction {
  return (loadout) => ({
    ...loadout,
    classType,
  });
}

function setClearSpace(clearSpace: boolean): LoadoutUpdateFunction {
  return (loadout) => ({
    ...loadout,
    clearSpace,
  });
}

/**
 * Replace the mods in this loadout with all the mods currently on this character's equipped armor.
 */
export function syncModsFromEquipped(store: DimStore): LoadoutUpdateFunction {
  return (loadout) => {
    const mods: number[] = [];
    const equippedArmor = store.items.filter(
      (item) => item.equipped && itemCanBeInLoadout(item) && item.bucket.sort === 'Armor'
    );
    for (const item of equippedArmor) {
      mods.push(...extractArmorModHashes(item));
    }

    return {
      ...loadout,
      parameters: {
        ...loadout.parameters,
        mods,
      },
    };
  };
}

export function clearBucketCategory(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  category: string
) {
  return clearBuckets(defs, defs.isDestiny2() ? D2Categories[category] : D1Categories[category]);
}

/**
 * Remove all items that are in one or more buckets.
 */
export function clearBuckets(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  bucketHashes: number[]
): LoadoutUpdateFunction {
  return (loadout) => ({
    ...loadout,
    items: loadout.items.filter((i) => {
      const bucketHash = getBucketHashFromItemHash(defs, i.hash);

      return (
        bucketHash &&
        // Subclasses are in "general" but shouldn't be cleared when we clear subclass
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

/* TODO:
const LoadoutParametersUpdateFunction = ()

function updateLoadoutParameters() {

}
*/

export function changeClearMods(enabled: boolean): LoadoutUpdateFunction {
  return (loadout) => ({
    ...loadout,
    parameters: {
      ...loadout.parameters,
      clearMods: enabled,
    },
  });
}

export function updateMods(mods: number[]): LoadoutUpdateFunction {
  return (loadout) => ({
    ...loadout,
    parameters: {
      ...loadout.parameters,
      mods,
    },
  });
}

export function updateModsByBucket(
  modsByBucket: { [bucketHash: number]: number[] } | undefined
): LoadoutUpdateFunction {
  return (loadout) => ({
    ...loadout,
    parameters: {
      ...loadout.parameters,
      modsByBucket: _.isEmpty(modsByBucket) ? undefined : modsByBucket,
    },
  });
}
