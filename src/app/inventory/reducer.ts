import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { DimStore } from './store-types';
import { InventoryBuckets } from './inventory-buckets';

// TODO: Should this be by account? Accounts need IDs
export interface InventoryState {
  // The same stores as before - these are regenerated anew
  // when stores reload or change, so they're safe for now.
  // Updates to items need to deeply modify their store though.
  // TODO: ReadonlyArray<Readonly<DimStore>>
  readonly stores: DimStore[];

  readonly buckets?: InventoryBuckets;
  /*
  readonly items: Readonly<{
    [id: string]: Readonly<DimItem>;
  }>;
  readonly characters: Readonly<{
    [id: string]: Readonly<DimStore>;
  }>;
  // TODO: break out characters from stores
  */
  // Buckets?
  // New-items
}

export type InventoryAction = ActionType<typeof actions>;

export const initialInventoryState: InventoryState = {
  stores: []
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
    case getType(actions.setBuckets):
      return {
        ...state,
        buckets: action.payload
      };
    default:
      return state;
  }
};
