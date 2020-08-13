import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { ThunkResult } from 'app/store/types';
import _ from 'lodash';
import { get } from 'idb-keyval';
import { VendorDrop } from './vendorDrops';
import { dropsNeedRefresh } from './vendorEngramsXyzService';

export interface VendorDropsState {
  loaded: boolean;
  vendorDrops: VendorDrop[];
  lastUpdated: Date;
}

const unloadedDate = new Date(1900, 1, 1);

export type VendorDropAction = ActionType<typeof actions>;

const initialState: VendorDropsState = {
  loaded: false,
  vendorDrops: [],
  lastUpdated: unloadedDate,
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
        vendorDrops: action.payload,
        lastUpdated: new Date(),
      };
    case getType(actions.clearVendorDrops): {
      return {
        ...state,
        loaded: false,
        vendorDrops: [],
        lastUpdated: unloadedDate,
      };
    }
    default:
      return state;
  }
};

export function loadVendorDropsFromIndexedDB(): ThunkResult {
  return async (dispatch, getState) => {
    if (!getState().vendorDrops.loaded) {
      const vendorDropsState = await get<VendorDropsState>('vendorengrams');

      if (
        vendorDropsState &&
        Array.isArray(vendorDropsState.vendorDrops) &&
        !dropsNeedRefresh(vendorDropsState)
      ) {
        dispatch(actions.loadVendorDrops(vendorDropsState.vendorDrops));

        return;
      }

      dispatch(actions.loadVendorDrops([]));
    }
  };
}
