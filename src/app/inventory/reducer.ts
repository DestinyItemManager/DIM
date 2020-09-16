import { DimError } from 'app/bungie-api/bungie-service-helper';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import produce, { Draft } from 'immer';
import _ from 'lodash';
import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import { setCurrentAccount } from '../accounts/actions';
import { AccountsAction } from '../accounts/reducer';
import * as actions from './actions';
import { DimItem } from './item-types';
import { DimStore } from './store-types';
import { ItemProto as D1ItemProto } from './store/d1-item-factory';
import { ItemProto as D2ItemProto } from './store/d2-item-factory';
import { createItemIndex } from './store/item-index';
import { findItemsByBucket, getItemAcrossStores, getStore, isVault } from './stores-helpers';

// TODO: Should this be by account? Accounts need IDs
export interface InventoryState {
  // The same stores as before - these are regenerated anew
  // when stores reload or change, so they're safe for now.
  // Updates to items need to deeply modify their store though.
  // TODO: ReadonlyArray<Readonly<DimStore>>
  readonly stores: DimStore[];

  readonly profileResponse?: DestinyProfileResponse;

  readonly profileError?: DimError;

  /**
   * The inventoryItemIds of all items that are "new".
   */
  readonly newItems: Set<string>;
  readonly newItemsLoaded: boolean;

  /** Are we currently dragging a stack? */
  readonly isDraggingStack: boolean;
}

export type InventoryAction = ActionType<typeof actions>;

const initialState: InventoryState = {
  stores: [],
  newItems: new Set(),
  newItemsLoaded: false,
  isDraggingStack: false,
};

export const inventory: Reducer<InventoryState, InventoryAction | AccountsAction> = (
  state: InventoryState = initialState,
  action: InventoryAction | AccountsAction
): InventoryState => {
  switch (action.type) {
    // TODO: rename to "replace inventory"
    case getType(actions.update):
      return updateInventory(state, action.payload);

    case getType(actions.touch):
      return {
        ...state,
        // Make a new array to break change detection for the root stores components
        stores: [...state.stores],
      };

    case getType(actions.touchItem):
      return touchItem(state, action.payload);

    case getType(actions.charactersUpdated):
      return updateCharacters(state, action.payload);

    // TODO: lock/unlock, track/untrack, etc
    case getType(actions.itemMoved): {
      const { item, source, target, equip, amount } = action.payload;
      return produce(state, (draft) => itemMoved(draft, item, source.id, target.id, equip, amount));
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

    // Stack dragging
    case getType(actions.stackableDrag):
      return {
        ...state,
        isDraggingStack: action.payload,
      };

    case getType(setCurrentAccount):
      return initialState;

    default:
      return state;
  }
};

function updateInventory(
  state: InventoryState,
  {
    stores,
    profileResponse,
  }: {
    stores: DimStore[];
    profileResponse?: DestinyProfileResponse | undefined;
  }
) {
  // TODO: we really want to decompose these, drive out all deep mutation
  // TODO: mark DimItem, DimStore properties as Readonly
  const newState = {
    ...state,
    stores,
    newItems: computeNewItems(state.stores, state.newItems, stores),
    profileError: undefined,
  };
  if (profileResponse) {
    newState.profileResponse = profileResponse;
  }
  return newState;
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
const canBeNew = (item: DimItem) => item.equipment && item.id !== '0' && item.type !== 'Class';

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

  let equal = true;
  for (const itemId of newItems) {
    if (!oldNewItems.has(itemId)) {
      equal = false;
      break;
    }
  }
  if (equal) {
    for (const itemId of oldNewItems) {
      if (!newItems.has(itemId)) {
        equal = false;
        break;
      }
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

function touchItem(state: InventoryState, itemId: string) {
  let item = getItemAcrossStores(state.stores, { id: itemId })!;
  if (!item) {
    return state;
  }
  let store = getStore(state.stores, item.owner)!;
  item = Object.assign(
    Object.create(store.destinyVersion === 2 ? D2ItemProto : D1ItemProto),
    item
  ) as DimItem;
  store = {
    ...store,
    items: store.items.map((i) => (i.id === item.id ? item : i)),
  };

  return {
    ...state,
    stores: state.stores.map((s) => (s.id === store.id ? store : s)),
  };
}

/**
 * Update our item and store models after an item has been moved (or equipped/dequipped).
 * @return the new or updated item (it may create a new item!)
 */
function itemMoved(
  draft: Draft<InventoryState>,
  item: DimItem,
  sourceStoreId: string,
  targetStoreId: string,
  equip: boolean,
  amount: number
): void {
  // Refresh all the items - they may have been reloaded!
  const stores = draft.stores;
  const source = getStore(stores, sourceStoreId);
  const target = getStore(stores, targetStoreId);
  if (!source || !target) {
    // TODO: log error
    return;
  }

  item = source.items.find(
    (i) => i.hash === item.hash && i.id === item.id && i.location.hash === item.location.hash
  )!;
  if (!item) {
    // TODO: log error
    return;
  }

  // If we've moved to a new place
  if (source.id !== target.id || item.location.inPostmaster) {
    // We handle moving stackable and nonstackable items almost exactly the same!
    const stackable = item.maxStackSize > 1;
    // Items to be decremented
    const sourceItems = stackable
      ? // For stackables, pull from all the items as a pool
        _.sortBy(
          findItemsByBucket(source, item.location.hash).filter(
            (i) => i.hash === item.hash && i.id === item.id
          ),
          (i) => i.amount
        )
      : // Otherwise we're moving the exact item we passed in
        [item];

    // Items to be incremented. There's really only ever at most one of these, but
    // it's easier to deal with as a list. An empty list means we'll vivify a new item there.
    const targetItems = stackable
      ? _.sortBy(
          findItemsByBucket(target, item.bucket.hash).filter(
            (i) =>
              i.hash === item.hash &&
              i.id === item.id &&
              // Don't consider full stacks as targets
              i.amount !== i.maxStackSize
          ),
          (i) => i.amount
        )
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
        // TODO: log error
        return;
      }

      const amountToRemove = Math.min(removeAmount, sourceItem.amount);
      sourceItem.amount -= amountToRemove;
      if (sourceItem.amount <= 0) {
        // Completely remove the source item
        if (removeItem(source, sourceItem)) {
          removedSourceItem = sourceItem.index === item.index;
        }
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

// Remove an item from this store. Returns whether it actually removed anything.
function removeItem(store: Draft<DimStore>, item: Draft<DimItem>) {
  // Completely remove the source item
  const sourceIndex = store.items.findIndex((i: DimItem) => item.index === i.index);
  if (sourceIndex >= 0) {
    store.items.splice(sourceIndex, 1);

    if (
      item.location.accountWide &&
      store.current &&
      store.vault?.vaultCounts[item.location.hash]
    ) {
      store.vault.vaultCounts[item.location.hash].count--;
    }

    return true;
  }
  return false;
}

function addItem(store: Draft<DimStore>, item: Draft<DimItem>) {
  store.items.push(item);
  item.owner = store.id;

  if (item.location.accountWide && store.current && store.vault) {
    store.vault.vaultCounts[item.location.hash].count++;
  } else if (isVault(store) && item.location.vaultBucket) {
    store.vaultCounts[item.location.vaultBucket.hash].count++;
  }
}
