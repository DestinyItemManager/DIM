import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './actions';
import { ClarityDescription } from './descriptions/descriptionInterface';

export type ClarityAction = ActionType<typeof actions>;

export interface ClarityState {
  /**
   * Descriptions from community provided by Clarity API
   */
  descriptions?: ClarityDescription;
}

const initialState: ClarityState = {};
export const clarity: Reducer<ClarityState, ClarityAction> = (
  state: ClarityState = initialState,
  action: ClarityAction,
): ClarityState => {
  switch (action.type) {
    case getType(actions.loadDescriptions): {
      const descriptions = action.payload;
      return {
        ...state,
        descriptions: descriptions ?? state.descriptions,
      };
    }
    default:
      return state;
  }
};
