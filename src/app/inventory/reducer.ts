import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { DimStore } from './store-types';
import { InventoryBuckets } from './inventory-buckets';
import { DimItemInfo } from './dim-item-info';

// TODO: Should this be by account? Accounts need IDs
export interface InventoryState {
  // The same stores as before - these are regenerated anew
  // when stores reload or change, so they're safe for now.
  // Updates to items need to deeply modify their store though.
  // TODO: ReadonlyArray<Readonly<DimStore>>
  readonly stores: DimStore[];

  readonly buckets?: InventoryBuckets;

  /**
   * The inventoryItemIds of all items that are "new".
   */
  readonly newItems: Set<string>;

  /**
   * Tags and notes for items.
   */
  readonly itemInfos: { [key: string]: DimItemInfo };
}

export type InventoryAction = ActionType<typeof actions>;

export const initialInventoryState: InventoryState = {
  stores: [],
  newItems: new Set(),
  itemInfos: {}
};

export const inventory: Reducer<InventoryState, InventoryAction> = (
  state: InventoryState = initialInventoryState,
  action: InventoryAction
) => {
  switch (action.type) {
    case getType(actions.update):
      // TODO: we really want to decompose these, drive out all deep mutation
      // TODO: mark DimItem, DimStore properties as Readonly
      return {
        ...state,
        stores: [...action.payload]
      };
    // TODO: only need to do this once, on loading a new platform
    case getType(actions.setBuckets):
      return {
        ...state,
        buckets: action.payload
      };

    case getType(actions.setNewItems):
      return {
        ...state,
        newItems: action.payload
      };

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
    default:
      return state;
  }
};
