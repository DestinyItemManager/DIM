import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { DimStore } from './store-types';
import { InventoryBuckets } from './inventory-buckets';
import { TagValue } from './dim-item-info';
import { AccountsAction, currentAccountSelector } from '../accounts/reducer';
import { setCurrentAccount } from '../accounts/actions';
import { RootState } from '../store/reducers';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import produce, { Draft } from 'immer';
import { observeStore } from 'app/utils/redux-utils';
import _ from 'lodash';
import { SyncService } from 'app/storage/sync.service';

/**
 * Set up an observer on the store that'll save item infos to sync service (google drive).
 * We specifically watch the legacy state, not the new one.
 */
export const saveItemInfosOnStateChange = _.once(() =>
  observeStore(
    (state: RootState) => state.inventory.itemInfos,
    (_currentState, nextState, rootState) => {
      const account = currentAccountSelector(rootState);
      if (account) {
        const key = `dimItemInfo-m${account.membershipId}-d${account.destinyVersion}`;
        SyncService.set({ [key]: nextState });
      }
    }
  )
);

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
  readonly itemInfos: {
    [key: string]: {
      tag?: TagValue;
      notes?: string;
    };
  };

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

    // *** Tags and notes ***

    case getType(actions.tagsAndNotesLoaded):
      return {
        ...state,
        itemInfos: action.payload
      };

    case getType(actions.setItemTag):
      return produce(state, (draft) => {
        setTag(draft, action.payload.itemId, action.payload.tag);
      });

    case getType(actions.setItemTagsBulk):
      return produce(state, (draft) => {
        for (const info of action.payload) {
          setTag(draft, info.itemId, info.tag);
        }
      });

    case getType(actions.setItemNote):
      return produce(state, (draft) => {
        setNote(draft, action.payload.itemId, action.payload.note);
      });

    case getType(actions.tagCleanup):
      return produce(state, (draft) => {
        for (const itemId of action.payload) {
          delete draft.itemInfos[itemId];
        }
      });

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

function setTag(draft: Draft<InventoryState>, itemId: string, tag?: TagValue) {
  const existingTag = draft.itemInfos[itemId];
  if (tag) {
    if (!existingTag) {
      draft.itemInfos[itemId] = {
        tag
      };
    } else {
      existingTag.tag = tag;
    }
  } else if (existingTag) {
    delete existingTag?.tag;
    if (!existingTag.tag && !existingTag.notes) {
      delete draft.itemInfos[itemId];
    }
  }
}

function setNote(draft: Draft<InventoryState>, itemId: string, notes?: string) {
  const existingTag = draft.itemInfos[itemId];
  if (notes && notes.length > 0) {
    if (!existingTag) {
      draft.itemInfos[itemId] = {
        notes
      };
    } else {
      existingTag.notes = notes;
    }
  } else if (existingTag) {
    delete existingTag?.notes;
    if (!existingTag.tag && !existingTag.notes) {
      delete draft.itemInfos[itemId];
    }
  }
}
