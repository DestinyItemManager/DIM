import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { DimStore } from './store-types';
import { InventoryBuckets } from './inventory-buckets';
import { DimItemInfo } from './dim-item-info';
import { AccountsAction } from '../accounts/reducer';
import { setCurrentAccount } from '../accounts/actions';
import { RootState } from '../store/reducers';
import { createSelector } from 'reselect';
import { characterSortSelector } from '../settings/character-sort';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';

export const storesSelector = (state: RootState) => state.inventory.stores;
export const sortedStoresSelector = createSelector(
  storesSelector,
  characterSortSelector,
  (stores, sortStores) => sortStores(stores)
);
export const storesLoadedSelector = (state: RootState) => storesSelector(state).length > 0;

export const ownedItemsSelector = () =>
  createSelector(storesSelector, (stores) => {
    const ownedItemHashes = new Set<number>();
    for (const store of stores) {
      for (const item of store.items) {
        ownedItemHashes.add(item.hash);
      }
    }
    return ownedItemHashes;
  });

export const profileResponseSelector = (state: RootState) => state.inventory.profileResponse;

// TODO: Should this be by account? Accounts need IDs
export interface InventoryState {
  // The same stores as before - these are regenerated anew
  // when stores reload or change, so they're safe for now.
  // Updates to items need to deeply modify their store though.
  // TODO: ReadonlyArray<Readonly<DimStore>>
  readonly stores: DimStore[];

  readonly buckets?: InventoryBuckets;

  readonly profileResponse?: DestinyProfileResponse;

  /**
   * The inventoryItemIds of all items that are "new".
   */
  readonly newItems: Set<string>;

  /**
   * Tags and notes for items.
   */
  readonly itemInfos: { [key: string]: DimItemInfo };

  /** Are we currently dragging a stack? */
  readonly isDraggingStack;
}

export type InventoryAction = ActionType<typeof actions>;

const initialState: InventoryState = {
  stores: [],
  newItems: new Set(),
  itemInfos: {},
  isDraggingStack: false
};

export const inventory: Reducer<InventoryState, InventoryAction | AccountsAction> = (
  state: InventoryState = initialState,
  action: InventoryAction | AccountsAction
) => {
  switch (action.type) {
    case getType(actions.update): {
      // TODO: we really want to decompose these, drive out all deep mutation
      // TODO: mark DimItem, DimStore properties as Readonly
      const newState = {
        ...state,
        stores: [...action.payload.stores]
      };
      if (action.payload.buckets) {
        newState.buckets = action.payload.buckets;
      }
      if (action.payload.newItems) {
        newState.newItems = action.payload.newItems;
      }
      if (action.payload.profileResponse) {
        newState.profileResponse = action.payload.profileResponse;
      }
      return newState;
    }

    // Buckets
    // TODO: only need to do this once, on loading a new platform.
    case getType(actions.setBuckets):
      return {
        ...state,
        buckets: action.payload
      };

    // New items
    case getType(actions.setNewItems):
      return {
        ...state,
        newItems: action.payload
      };

    // Tags and notes
    case getType(actions.setTagsAndNotes):
      return {
        ...state,
        itemInfos: action.payload
      };

    case getType(actions.setTagsAndNotesForItem):
      if (action.payload.info) {
        return {
          ...state,
          itemInfos: {
            ...state.itemInfos,
            [action.payload.key]: action.payload.info
          }
        };
      } else {
        // Remove the note via destructuring
        const { [action.payload.key]: removedKey, ...itemInfos } = state.itemInfos;

        return {
          ...state,
          itemInfos
        };
      }

    // Stack dragging
    case getType(actions.stackableDrag):
      return {
        ...state,
        isDraggingStack: action.payload
      };

    case getType(setCurrentAccount):
      return {
        ...initialState
      };

    default:
      return state;
  }
};
