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
  // I will add more things i need for clarity later on
}

const initialState: ClarityState = {};
export const clarity: Reducer<ClarityState, ClarityAction> = (
  state: ClarityState = initialState,
  action: ClarityAction
) => {
  switch (action.type) {
    case getType(actions.loadDescriptions):
      return {
        ...state,
        descriptions: action.payload,
      };
    default:
      return state;
  }
};
