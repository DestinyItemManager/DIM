import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { showNotification } from 'app/notifications/notifications';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import produce from 'immer';
import _ from 'lodash';
import { Loadout, LoadoutItem, ResolvedLoadoutItem } from './loadout-types';
import { singularBucketHashes } from './loadout-utils';

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
    }
  /** Applies socket overrides to the supplied item */
  | { type: 'applySocketOverrides'; item: DimItem; socketOverrides: SocketOverrides }
  | { type: 'updateModsByBucket'; modsByBucket: LoadoutParameters['modsByBucket'] }
  /** Remove an item from the loadout */
  | { type: 'removeItem'; item: DimItem; items: ResolvedLoadoutItem[] }
  /** Make an item that's already in the loadout equipped */
  | { type: 'equipItem'; item: DimItem; items: ResolvedLoadoutItem[] }
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
        const { item, equip } = action;

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
        const draftLoadout = addItem(defs, loadout, item, equip);
        return {
          ...state,
          loadout: draftLoadout,
        };
      }

      case 'removeItem': {
        const { loadout } = state;
        const { item, items } = action;
        return loadout ? { ...state, loadout: removeItem(loadout, item, items) } : state;
      }

      case 'equipItem': {
        const { loadout } = state;
        const { item, items } = action;
        return loadout ? { ...state, loadout: equipItem(loadout, item, items) } : state;
      }

      case 'applySocketOverrides': {
        const { loadout } = state;
        const { item, socketOverrides } = action;
        return loadout
          ? { ...state, loadout: applySocketOverrides(loadout, item, socketOverrides) }
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
  equip?: boolean
): Loadout {
  const loadoutItem: LoadoutItem = {
    id: item.id,
    hash: item.hash,
    amount: 1,
    equip: false,
  };

  // TODO: We really want to be operating against the resolved items, right? Should we re-resolve them here, or what?
  //       If we don't, we may not properly detect a dupe?

  // We only allow one subclass, and it must be equipped. Same with a couple other things.
  const singular = singularBucketHashes.includes(item.bucket.hash);
  const maxSlots = singular ? 1 : item.bucket.capacity;

  return produce(loadout, (draftLoadout) => {
    // If this item is already in the loadout, find it via its id/hash.
    const dupe = loadout.items.find((i) => i.hash === item.hash && i.id === item.id);
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
function removeItem(
  loadout: Readonly<Loadout>,
  item: DimItem,
  items: ResolvedLoadoutItem[]
): Loadout {
  return produce(loadout, (draftLoadout) => {
    const loadoutItem = draftLoadout.items.find((i) => i.hash === item.hash && i.id === item.id);

    if (!loadoutItem) {
      return;
    }

    const decrement = 1;
    loadoutItem.amount ||= 1;
    loadoutItem.amount -= decrement;
    if (loadoutItem.amount <= 0) {
      draftLoadout.items = draftLoadout.items.filter(
        (i) => !(i.hash === item.hash && i.id === item.id)
      );
    }

    if (loadoutItem.equip) {
      const typeInventory = items.filter((li) => li.item.bucket.hash === item.bucket.hash);
      const nextInLine =
        typeInventory.length > 0 &&
        draftLoadout.items.find(
          (i) =>
            i.id === typeInventory[0].loadoutItem.id && i.hash === typeInventory[0].loadoutItem.hash
        );
      if (nextInLine) {
        nextInLine.equip = true;
      }
    }
  });
}

/**
 * Produce a new loadout with the given item switched to being equipped (or unequipped if it's already equipped).
 */
function equipItem(loadout: Readonly<Loadout>, item: DimItem, items: ResolvedLoadoutItem[]) {
  return produce(loadout, (draftLoadout) => {
    const findItem = (item: DimItem) =>
      draftLoadout.items.find((i) => i.id === item.id && i.hash === item.hash)!;

    // Classes are always equipped
    if (item.bucket.hash === BucketHashes.Subclass) {
      return;
    }

    const loadoutItem = findItem(item);
    if (item.equipment) {
      if (loadoutItem.equip) {
        // It's equipped, mark it unequipped
        loadoutItem.equip = false;
      } else {
        // It's unequipped - mark all the other items and conflicting exotics unequipped, then mark this equipped
        items
          .filter(
            (li) =>
              // Others in this slot
              li.item.bucket.hash === item.bucket.hash ||
              // Other exotics
              (item.equippingLabel && li.item.equippingLabel === item.equippingLabel)
          )
          .map(
            ({ loadoutItem }) =>
              draftLoadout.items.find(
                (i) => i.id === loadoutItem.id && i.hash === loadoutItem.hash
              )!
          )
          .forEach((i) => {
            i.equip = false;
          });

        loadoutItem.equip = true;
      }
    }
  });
}

function applySocketOverrides(
  loadout: Readonly<Loadout>,
  item: DimItem,
  socketOverrides: SocketOverrides
) {
  return produce(loadout, (draftLoadout) => {
    let loadoutItem = draftLoadout.items.find((li) => li.id === item.id);
    // TODO: right now socketOverrides are only really used for subclasses, so we can match by hash
    if (!loadoutItem) {
      loadoutItem = draftLoadout.items.find((li) => li.hash === item.hash);
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
    const def = defs.InventoryItem.get(li.hash);
    const bucketHash =
      def && ('bucketTypeHash' in def ? def.bucketTypeHash : def.inventory?.bucketTypeHash);
    return bucketHash && bucketHash === searchBucketHash;
  });
}
