import { compareBy } from 'app/utils/comparators';
import { warnLog } from 'app/utils/log';
import {
  DestinyItemChangeResponse,
  DestinyItemComponent,
  DestinyProfileResponse,
  ItemLocation,
} from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { Draft, produce } from 'immer';
import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import { setCurrentAccount } from '../accounts/actions';
import type { AccountsAction } from '../accounts/reducer';
import * as actions from './actions';
import { DimItem } from './item-types';
import { AccountCurrency, DimStore } from './store-types';
import { ItemCreationContext, makeItem } from './store/d2-item-factory';
import { createItemIndex } from './store/item-index';
import { findItemsByBucket, getCurrentStore, getStore, getVault } from './stores-helpers';

const TAG = 'move';

// TODO: Should this be by account? Accounts need IDs
export interface InventoryState {
  // The same stores as before - these are regenerated anew
  // when stores reload or change, so they're safe for now.
  // Updates to items need to deeply modify their store though.
  // TODO: ReadonlyArray<Readonly<DimStore>>
  readonly stores: DimStore[];

  /**
   * Account-wide currencies (glimmer, shards, etc.). Silver is only available
   * while the player is in game.
   */
  readonly currencies: AccountCurrency[];

  readonly live: boolean;
  readonly profileResponse?: DestinyProfileResponse;
  readonly profileError?: Error;

  /**
   * The inventoryItemIds of all items that are "new".
   */
  readonly newItems: Set<string>;
  readonly newItemsLoaded: boolean;

  /**
   * An API profile response. If this is present,
   * we use it instead of talking to the Bungie API.
   */
  readonly mockProfileData?: DestinyProfileResponse;
}

export type InventoryAction = ActionType<typeof actions>;

const initialState: InventoryState = {
  stores: [],
  currencies: [],
  newItems: new Set(),
  newItemsLoaded: false,
  live: false,
};

export const inventory: Reducer<InventoryState, InventoryAction | AccountsAction> = (
  state: InventoryState = initialState,
  action: InventoryAction | AccountsAction,
): InventoryState => {
  switch (action.type) {
    case getType(actions.profileLoaded):
      if (
        action.payload.profile.responseMintedTimestamp <=
        (state.profileResponse?.responseMintedTimestamp ?? 0)
      ) {
        warnLog(
          'd2-stores',
          'Not updating profile, it is older than what we already have',
          action.payload.profile.responseMintedTimestamp,
          state.profileResponse?.responseMintedTimestamp,
        );
        return state;
      }
      return {
        ...state,
        profileResponse: action.payload.profile,
        profileError: action.payload.live ? undefined : state.profileError,
        live: action.payload.live,
      };

    case getType(actions.profileError):
      return { ...state, profileError: action.payload };

    case getType(actions.update):
      if (
        action.payload.responseMintedTimestamp &&
        state.profileResponse &&
        action.payload.responseMintedTimestamp !== state.profileResponse.responseMintedTimestamp
      ) {
        warnLog(
          'd2-stores',
          'Not updating inventory - the profile has changed from under us',
          action.payload.responseMintedTimestamp,
          state.profileResponse.responseMintedTimestamp,
        );
        return state;
      }
      return updateInventory(state, action.payload);

    case getType(actions.charactersUpdated):
      return updateCharacters(state, action.payload);

    case getType(actions.itemMoved): {
      const { itemId, itemHash, itemLocation, sourceId, targetId, equip, amount } = action.payload;
      return produce(state, (draft) =>
        itemMoved(draft, itemHash, itemId, itemLocation, sourceId, targetId, equip, amount),
      );
    }

    case getType(actions.itemLockStateChanged): {
      const { item, state: lockState, type } = action.payload;
      return produce(state, (draft) => itemLockStateChanged(draft, item, lockState, type));
    }

    case getType(actions.awaItemChanged): {
      const { changes, item, itemCreationContext } = action.payload;
      return produce(state, (draft) => awaItemChanged(draft, changes, item, itemCreationContext));
    }

    case getType(actions.error):
      return {
        ...state,
        profileError: action.payload,
      };

    // *** New items ***

    case getType(actions.setNewItems):
      return {
        ...state,
        newItems: action.payload,
        newItemsLoaded: true,
      };

    case getType(actions.clearNewItem):
      if (state.newItems.has(action.payload)) {
        const newItems = new Set(state.newItems);
        newItems.delete(action.payload);

        return {
          ...state,
          newItems,
        };
      } else {
        return state;
      }

    case getType(actions.clearAllNewItems):
      return {
        ...state,
        newItems: new Set(),
      };

    case getType(setCurrentAccount):
      return initialState;

    case getType(actions.setMockProfileResponse):
      return {
        ...state,
        mockProfileData: action.payload,
        profileResponse: undefined,
      };

    case getType(actions.clearStores):
      return {
        ...state,
        stores: [],
      };

    default:
      return state;
  }
};

function updateInventory(
  state: InventoryState,
  {
    stores,
    currencies,
  }: {
    stores: DimStore[];
    currencies: AccountCurrency[];
  },
) {
  // TODO: we really want to decompose these, drive out all deep mutation
  // TODO: mark DimItem, DimStore properties as Readonly
  return {
    ...state,
    stores,
    currencies,
    newItems: computeNewItems(state.stores, state.newItems, stores),
  };
}

/**
 * Merge in new top-level character info (stats, etc)
 */
function updateCharacters(state: InventoryState, characters: actions.CharacterInfo[]) {
  return {
    ...state,
    stores: state.stores.map((store) => {
      const character = characters.find((c) => c.characterId === store.id);
      if (!character) {
        return store;
      }
      const { characterId, ...characterInfo } = character;
      return {
        ...store,
        ...characterInfo,
        stats: {
          ...store.stats,
          ...characterInfo.stats,
        },
      };
    }),
  };
}

/** Can an item be marked as new? */
const canBeNew = (item: DimItem) =>
  item.equipment && item.instanced && item.bucket.hash !== BucketHashes.Subclass;

/**
 * Given an old inventory, a new inventory, and all the items that were previously marked as new,
 * calculate the new set of new items.
 */
function computeNewItems(oldStores: DimStore[], oldNewItems: Set<string>, newStores: DimStore[]) {
  if (oldStores === newStores) {
    return oldNewItems;
  }

  // Get the IDs of all old items
  const allOldItems = new Set<string>();
  for (const store of oldStores) {
    for (const item of store.items) {
      if (canBeNew(item)) {
        allOldItems.add(item.id);
      }
    }
  }

  // If we didn't have any items before, don't suddenly mark everything new
  if (!allOldItems.size) {
    return oldNewItems;
  }

  // Get the IDs of all new items
  const allNewItems = new Set<string>();
  for (const store of newStores) {
    for (const item of store.items) {
      if (canBeNew(item)) {
        allNewItems.add(item.id);
      }
    }
  }

  const newItems = new Set<string>();

  // Add all previous new items that are still in the new inventory
  for (const itemId of oldNewItems) {
    if (allNewItems.has(itemId)) {
      newItems.add(itemId);
    }
  }

  // Add all new items that aren't in old items
  for (const itemId of allNewItems) {
    if (!allOldItems.has(itemId)) {
      newItems.add(itemId);
    }
  }

  return setsEqual(newItems, oldNewItems) ? oldNewItems : newItems;
}

/**
 * Compute if two sets are equal by seeing that every item of each set is present in the other.
 */
function setsEqual<T>(first: Set<T>, second: Set<T>) {
  if (first.size !== second.size) {
    return false;
  }

  let equal = true;
  for (const itemId of first) {
    if (!second.has(itemId)) {
      equal = false;
      break;
    }
  }
  if (equal) {
    for (const itemId of second) {
      if (!first.has(itemId)) {
        equal = false;
        break;
      }
    }
  }
  return equal;
}

/**
 * Update our item and store models after an item has been moved (or equipped/dequipped).
 */
function itemMoved(
  draft: Draft<InventoryState>,
  itemHash: number,
  itemId: string,
  itemLocation: BucketHashes,
  sourceStoreId: string,
  targetStoreId: string,
  equip: boolean,
  amount: number,
): void {
  // Refresh all the items - they may have been reloaded!
  const stores = draft.stores;
  const source = getStore(stores, sourceStoreId);
  const target = getStore(stores, targetStoreId);
  if (!source || !target) {
    warnLog(TAG, 'Either source or target store not found', source, target);
    return;
  }

  let item = source.items.find(
    (i) => i.hash === itemHash && i.id === itemId && i.location.hash === itemLocation,
  )!;
  if (!item) {
    warnLog(TAG, 'Moved item not found', item);
    return;
  }

  // If we've moved to a new place
  if (source.id !== target.id || item.location.inPostmaster) {
    // We handle moving stackable and nonstackable items almost exactly the same!
    const stackable = item.maxStackSize > 1;
    // Items to be decremented
    const sourceItems = stackable
      ? // For stackables, pull from all the items as a pool
        findItemsByBucket(source, item.location.hash)
          .filter((i) => i.hash === item.hash && i.id === item.id)
          .sort(compareBy((i) => i.amount))
      : // Otherwise we're moving the exact item we passed in
        [item];

    // Items to be incremented. There's really only ever at most one of these, but
    // it's easier to deal with as a list. An empty list means we'll vivify a new item there.
    const targetItems = stackable
      ? findItemsByBucket(target, item.bucket.hash)
          .filter(
            (i) =>
              i.hash === item.hash &&
              i.id === item.id &&
              // Don't consider full stacks as targets
              i.amount !== i.maxStackSize,
          )
          .sort(compareBy((i) => i.amount))
      : [];

    // moveAmount could be more than maxStackSize if there is more than one stack on a character!
    const moveAmount = amount || item.amount || 1;
    let addAmount = moveAmount;
    let removeAmount = moveAmount;
    let removedSourceItem = false;

    // Remove inventory from the source
    while (removeAmount > 0) {
      const sourceItem = sourceItems.shift();
      if (!sourceItem) {
        warnLog(TAG, 'Source item missing', item);
        return;
      }

      const amountToRemove = Math.min(removeAmount, sourceItem.amount);
      sourceItem.amount -= amountToRemove;
      // Completely remove the source item
      if (sourceItem.amount <= 0 && removeItem(source, sourceItem)) {
        removedSourceItem = sourceItem.index === item.index;
      }

      removeAmount -= amountToRemove;
    }

    // Add inventory to the target (destination)
    let targetItem = item;
    while (addAmount > 0) {
      targetItem = targetItems.shift()!;

      if (!targetItem) {
        targetItem = item;
        if (!removedSourceItem) {
          // This assumes (as we shouldn't) that we have no nested mutable state in the item
          targetItem = { ...item };
          targetItem.index = createItemIndex(targetItem);
        }
        removedSourceItem = false; // only move without cloning once
        targetItem.amount = 0; // We'll increment amount below
        if (targetItem.location.inPostmaster) {
          targetItem.location = targetItem.bucket;
        }
        addItem(target, targetItem);
      }

      const amountToAdd = Math.min(addAmount, targetItem.maxStackSize - targetItem.amount);
      targetItem.amount += amountToAdd;
      addAmount -= amountToAdd;
    }
    item = targetItem; // The item we're operating on switches to the last target
  }

  if (equip) {
    for (const i of target.items) {
      // Set equipped for all items in the bucket
      if (i.location.hash === item.bucket.hash) {
        i.equipped = i.index === item.index;
      }
    }
  }
}

function itemLockStateChanged(
  draft: Draft<InventoryState>,
  item: DimItem,
  state: boolean,
  type: 'lock' | 'track',
) {
  const source = getStore(draft.stores, item.owner);
  if (!source) {
    warnLog(TAG, 'Store', item.owner, 'not found');
    return;
  }

  // Only instanced items can be locked/tracked
  item = source.items.find((i) => i.id === item.id)!;
  if (!item) {
    warnLog(TAG, 'Item not found in stores', item);
    return;
  }

  if (type === 'lock') {
    item.locked = state;
  } else if (type === 'track') {
    item.tracked = state;
  }
}

/**
 * Handle the changes that come from messing with perks/sockets via AWA. The item
 * itself is recreated, while various currencies and tokens get consumed or created.
 */
function awaItemChanged(
  draft: Draft<InventoryState>,
  changes: DestinyItemChangeResponse,
  item: DimItem | undefined,
  itemCreationContext: ItemCreationContext,
) {
  const { defs, buckets } = itemCreationContext;

  // Replace item
  if (!item) {
    warnLog('awaChange', 'No item produced from change');
    return;
  }
  const owner = getStore(draft.stores, item.owner);
  if (!owner) {
    return;
  }

  const sourceIndex = owner.items.findIndex((i) => i.index === item.index);
  if (sourceIndex >= 0) {
    owner.items[sourceIndex] = item;
  } else {
    addItem(owner, item);
  }

  const getSource = (component: DestinyItemComponent) => {
    let realOwner = owner;
    if (component.location === ItemLocation.Vault) {
      // I don't think this can happen
      realOwner = getVault(draft.stores)! as Draft<DimStore>;
    } else {
      const itemDef = defs.InventoryItem.get(component.itemHash);
      if (itemDef.inventory && buckets.byHash[itemDef.inventory.bucketTypeHash].accountWide) {
        realOwner = getCurrentStore(draft.stores)!;
      }
    }
    return realOwner;
  };

  // Remove items
  // TODO: Question - does the API just completely remove a stack and add a new stack, or does it just
  // say it deleted a stack representing the difference?
  for (const removedItemComponent of changes.removedInventoryItems) {
    // Currencies (glimmer, shards) are easy!
    const currency = draft.currencies.find((c) => c.itemHash === removedItemComponent.itemHash);
    if (currency) {
      currency.quantity = Math.max(0, currency.quantity - removedItemComponent.quantity);
    } else if (removedItemComponent.itemInstanceId) {
      for (const store of draft.stores) {
        const removedItemIndex = store.items.findIndex(
          (i) => i.id === removedItemComponent.itemInstanceId,
        );
        if (removedItemIndex >= 0) {
          store.items.splice(removedItemIndex, 1);
          break;
        }
      }
    } else {
      // uninstanced (stacked, likely) item.
      const source = getSource(removedItemComponent);
      const sourceItems = source.items
        .filter((i) => i.hash === removedItemComponent.itemHash)
        .sort(compareBy((i) => i.amount));

      // TODO: refactor!
      let removeAmount = removedItemComponent.quantity;
      // Remove inventory from the source
      while (removeAmount > 0) {
        const sourceItem = sourceItems.shift();
        if (!sourceItem) {
          warnLog(TAG, 'Source item missing', item, removedItemComponent);
          return;
        }

        const amountToRemove = Math.min(removeAmount, sourceItem.amount);
        sourceItem.amount -= amountToRemove;
        if (sourceItem.amount <= 0) {
          // Completely remove the source item
          removeItem(source, sourceItem);
        }

        removeAmount -= amountToRemove;
      }
    }
  }

  // Add items
  for (const addedItemComponent of changes.addedInventoryItems) {
    // Currencies (glimmer, shards) are easy!
    const currency = draft.currencies.find((c) => c.itemHash === addedItemComponent.itemHash);
    if (currency) {
      const max =
        defs.InventoryItem.get(addedItemComponent.itemHash).inventory?.maxStackSize ||
        Number.MAX_SAFE_INTEGER;
      currency.quantity = Math.min(max, currency.quantity + addedItemComponent.quantity);
    } else if (addedItemComponent.itemInstanceId) {
      const addedOwner = getSource(addedItemComponent);
      const addedItem = makeItem(itemCreationContext, addedItemComponent, addedOwner);
      if (addedItem) {
        addItem(addedOwner, addedItem);
      }
    } else {
      // Uninstanced (probably stacked) item
      const target = getSource(addedItemComponent);
      const targetItems = target.items
        .filter((i) => i.hash === addedItemComponent.itemHash)
        .sort(compareBy((i) => i.amount));
      let addAmount = addedItemComponent.quantity;
      const addedItem = makeItem(itemCreationContext, addedItemComponent, target);
      if (!addedItem) {
        continue;
      }
      // TODO: refactor out "increment/decrement item amounts"?
      while (addAmount > 0) {
        let targetItem = targetItems.shift();

        if (!targetItem) {
          targetItem = addedItem;
          targetItem.amount = 0; // We'll increment amount below
          addItem(target, targetItem);
        }

        const amountToAdd = Math.min(addAmount, targetItem.maxStackSize - targetItem.amount);
        targetItem.amount += amountToAdd;
        addAmount -= amountToAdd;
      }
    }
  }
}

// Remove an item from this store. Returns whether it actually removed anything.
function removeItem(store: Draft<DimStore>, item: Draft<DimItem>) {
  // Completely remove the source item
  const sourceIndex = store.items.findIndex((i: DimItem) => item.index === i.index);
  if (sourceIndex >= 0) {
    store.items.splice(sourceIndex, 1);
    return true;
  }

  return false;
}

function addItem(store: Draft<DimStore>, item: Draft<DimItem>) {
  item.owner = store.id;
  // Originally this was just "store.items.push(item)" but it caused Immer to think we had circular references
  store.items = [...store.items, item];
}
