import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { DimStore } from './store-types';
import { AccountsAction } from '../accounts/reducer';
import { setCurrentAccount } from '../accounts/actions';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { DimItem } from './item-types';
import { DimError } from 'app/bungie-api/bungie-service-helper';
import { StoreProto as D2StoreProto, StoreProto } from './store/d2-store-factory';
import { StoreProto as D1StoreProto } from './store/d1-store-factory';
import { getItemAcrossStores, getStore } from './stores-helpers';
import { ItemProto } from './store/d2-item-factory';

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
  readonly isDraggingStack;
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
) => {
  switch (action.type) {
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

    // Buckets
    // TODO: only need to do this once, on loading a new platform.
    case getType(actions.setBuckets):
      return {
        ...state,
        buckets: action.payload,
      };

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
      return Object.assign(
        // Have to make it into a full object again. TODO: un-object-ify this
        Object.create(store.isDestiny2() ? D2StoreProto : D1StoreProto),
        {
          ...store,
          ...characterInfo,
          stats: {
            ...store.stats,
            ...characterInfo.stats,
          },
        }
      );
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
  item = Object.assign(Object.create(ItemProto), item) as DimItem;
  store = Object.assign(Object.create(StoreProto), {
    ...store,
    items: store.items.map((i) => (i.id === item.id ? item : i)),
    buckets: {
      ...store.buckets,
      [item.location.hash]: store.buckets[item.location.hash].map((i) =>
        i.id === item.id ? item : i
      ),
    },
  });

  return {
    ...state,
    stores: state.stores.map((s) => (s.id === store.id ? store : s)),
  };
}
