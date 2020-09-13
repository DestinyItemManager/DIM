import { RootState } from 'app/store/types';
import { Reducer } from 'redux';
import { createSelector } from 'reselect';
import { ActionType, getType } from 'typesafe-actions';
import { storesSelector } from '../inventory/selectors';
import * as actions from './basic-actions';

export const farmingStoreSelector = () =>
  createSelector(
    storesSelector,
    (state: RootState) => state.farming.storeId,
    (stores, storeId) => stores.find((s) => s.id === storeId)
  );

export const farmingInterruptedSelector = (state: RootState) => state.farming.numInterruptions > 0;

export interface FarmingState {
  // The actively farming store, if any
  readonly storeId?: string;
  // A counter for pending tasks that interrupt farming
  readonly numInterruptions: number;
}

export type FarmingAction = ActionType<typeof actions>;

const initialState: FarmingState = {
  numInterruptions: 0,
};

export const farming: Reducer<FarmingState, FarmingAction> = (
  state: FarmingState = initialState,
  action: FarmingAction
) => {
  switch (action.type) {
    case getType(actions.start):
      return {
        ...state,
        storeId: action.payload,
      };

    case getType(actions.stop):
      return {
        ...state,
        storeId: undefined,
      };

    case getType(actions.interruptFarming):
      return {
        ...state,
        numInterruptions: state.numInterruptions + 1,
      };

    case getType(actions.resumeFarming):
      return {
        ...state,
        numInterruptions: state.numInterruptions - 1,
      };

    default:
      return state;
  }
};
