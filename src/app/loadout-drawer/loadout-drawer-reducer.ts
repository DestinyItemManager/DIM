import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { showNotification } from 'app/notifications/notifications';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyClass, TierType } from 'bungie-api-ts/destiny2';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import produce from 'immer';
import _ from 'lodash';
import { Loadout, LoadoutItem, ResolvedLoadoutItem } from './loadout-types';
import { findSameLoadoutItemIndex, singularBucketHashes } from './loadout-utils';

export interface State {
  loadout: Readonly<Loadout>;
}

export type Action =
  /** Replace the current loadout with an updated one */
  | { type: 'update'; loadout: Loadout }
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
  | { type: 'removeMod'; hash: number };

/**
 * All state for this component is managed through this reducer and the Actions above.
 */
export function stateReducer(defs: D2ManifestDefinitions | D1ManifestDefinitions) {
  return (state: State, action: Action): State => {
    switch (action.type) {
      case 'update':
        return {
          ...state,
          loadout: action.loadout,
        };

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
        const draftLoadout = addItem(defs, loadout, item, equip, socketOverrides);
        return {
          ...state,
          loadout: draftLoadout,
        };
      }

      case 'removeItem': {
        const { loadout } = state;
        const { resolvedItem } = action;
        return loadout ? { ...state, loadout: removeItem(defs, loadout, resolvedItem) } : state;
      }

      case 'equipItem': {
        const { loadout } = state;
        const { resolvedItem } = action;
        return loadout ? { ...state, loadout: equipItem(defs, loadout, resolvedItem) } : state;
      }

      case 'applySocketOverrides': {
        const { loadout } = state;
        const { resolvedItem, socketOverrides } = action;
        return loadout
          ? {
              ...state,
              loadout: applySocketOverrides(loadout, resolvedItem, socketOverrides),
            }
          : state;
      }

      case 'updateModsByBucket': {
        const { loadout } = state;
        const { modsByBucket } = action;
        return loadout
          ? {
              ...state,
              loadout: {
                ...loadout,
                parameters: {
                  ...loadout.parameters,
                  modsByBucket: _.isEmpty(modsByBucket) ? undefined : modsByBucket,
                },
              },
            }
          : state;
      }

      case 'updateMods': {
        const { loadout } = state;
        const { mods } = action;
        return loadout
          ? {
              ...state,
              loadout: {
                ...loadout,
                parameters: {
                  ...loadout.parameters,
                  mods,
                },
              },
            }
          : state;
      }

      case 'changeClearMods': {
        const { loadout } = state;
        const { enabled } = action;
        return loadout
          ? {
              ...state,
              loadout: {
                ...loadout,
                parameters: {
                  ...loadout.parameters,
                  clearMods: enabled,
                },
              },
            }
          : state;
      }

      case 'removeMod': {
        const { loadout } = state;
        const { hash } = action;
        if (loadout) {
          const newLoadout = { ...loadout };
          const newMods = newLoadout.parameters?.mods?.length
            ? [...newLoadout.parameters.mods]
            : [];
          const index = newMods.indexOf(hash);
          if (index !== -1) {
            newMods.splice(index, 1);
            newLoadout.parameters = {
              ...newLoadout.parameters,
              mods: newMods,
            };
            return { ...state, loadout: newLoadout };
          }
        }
        return state;
      }
    }
  };
}

/**
 * Produce a new loadout that adds a new item to the given loadout.
 */
function addItem(
  defs: D2ManifestDefinitions | D1ManifestDefinitions,
  loadout: Readonly<Loadout>,
  item: DimItem,
  equip?: boolean,
  socketOverrides?: SocketOverrides
): Loadout {
  const loadoutItem: LoadoutItem = {
    id: item.id,
    hash: item.hash,
    amount: 1,
    equip: false,
  };
  if (socketOverrides) {
    loadoutItem.socketOverrides = socketOverrides;
  }

  // We only allow one subclass, and it must be equipped. Same with a couple other things.
  const singular = singularBucketHashes.includes(item.bucket.hash);
  const maxSlots = singular ? 1 : item.bucket.capacity;

  return produce(loadout, (draftLoadout) => {
    // If this item is already in the loadout, find it via its id/hash.
    const dupeIndex = findSameLoadoutItemIndex(defs, draftLoadout.items, loadoutItem);
    if (dupeIndex !== -1) {
      const dupe = draftLoadout.items[dupeIndex];
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
function removeItem(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  loadout: Readonly<Loadout>,
  { item, loadoutItem: searchLoadoutItem }: ResolvedLoadoutItem
): Loadout {
  return produce(loadout, (draftLoadout) => {
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
 * Produce a new loadout with the given item switched to being equipped (or unequipped if it's already equipped).
 */
function equipItem(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  loadout: Readonly<Loadout>,
  { item, loadoutItem: searchLoadoutItem }: ResolvedLoadoutItem
) {
  return produce(loadout, (draftLoadout) => {
    // Subclasses and some others are always equipped
    if (singularBucketHashes.includes(item.bucket.hash)) {
      return;
    }

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

function applySocketOverrides(
  loadout: Readonly<Loadout>,
  { loadoutItem: searchLoadoutItem }: ResolvedLoadoutItem,
  socketOverrides: SocketOverrides
) {
  return produce(loadout, (draftLoadout) => {
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
