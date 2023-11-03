import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './basic-actions';

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
  action: FarmingAction,
): FarmingState => {
  switch (action.type) {
    case getType(actions.start):
      return {
        ...state,
        storeId: action.payload,
        numInterruptions: 0,
      };

    case getType(actions.stop):
      return {
        ...state,
        storeId: undefined,
        numInterruptions: 0,
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
