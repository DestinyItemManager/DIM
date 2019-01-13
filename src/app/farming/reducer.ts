import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import * as _ from 'lodash';
import { createSelector } from 'reselect';
import { storesSelector } from '../inventory/reducer';
import { RootState } from '../store/reducers';

export const farmingStoreSelector = createSelector(
  storesSelector,
  (state: RootState) => state.farming.storeId,
  (stores, storeId) => stores.find((s) => s.id === storeId)
);

export interface FarmingState {
  // The actively farming store, if any
  readonly storeId?: string;
}

export type FarmingAction = ActionType<typeof actions>;

const initialState: FarmingState = {};

export const farming: Reducer<FarmingState, FarmingAction> = (
  state: FarmingState = initialState,
  action: FarmingAction
) => {
  switch (action.type) {
    case getType(actions.start):
      return {
        ...state,
        storeId: action.payload
      };

    case getType(actions.stop):
      return {
        ...state,
        storeId: undefined
      };

    default:
      return state;
  }
};
