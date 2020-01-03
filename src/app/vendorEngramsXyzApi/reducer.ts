import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { ThunkResult } from '../store/reducers';
import _ from 'lodash';
import { observeStore } from '../utils/redux-utils';
import { set, get } from 'idb-keyval';
import { VendorDrop } from './vendorDrops';

export interface VendorDropsState {
  loaded: boolean;
  vendorDrops: VendorDrop[];
}

export type VendorDropAction = ActionType<typeof actions>;

const initialState: VendorDropsState = {
  loaded: false,
  vendorDrops: []
};

export const vendorDrops: Reducer<VendorDropsState, VendorDropAction> = (
  state: VendorDropsState = initialState,
  action: VendorDropAction
) => {
  switch (action.type) {
    case getType(actions.loadVendorDrops):
      return {
        ...state,
        loaded: true,
        vendorDrops: action.payload
      };
    case getType(actions.clearVendorDrops): {
      return {
        ...state,
        loaded: false,
        vendorDrops: []
      };
    }
    default:
      return state;
  }
};

export function saveVendorDropsToIndexedDB() {
  return observeStore(
    (state) => state.vendorDrops,
    (_, nextState) => {
      if (nextState.loaded) {
        set('vendorengrams', nextState.vendorDrops);
      }
    }
  );
}

export function loadVendorDropsFromIndexedDB(): ThunkResult<Promise<void>> {
  return async (dispatch, getState) => {
    if (!getState().vendorDrops.loaded) {
      const vendorDrops = await get<VendorDropsState>('vendorengrams');

      // easing the transition from the old state (just an array) to the new state
      // (object containing an array)
      if (vendorDrops && Array.isArray(vendorDrops)) {
        dispatch(actions.loadVendorDrops(vendorDrops));

        return;
      }

      dispatch(actions.loadVendorDrops([]));
    }
  };
}
