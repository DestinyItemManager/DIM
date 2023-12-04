import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './actions';
import { ClarityCharacterStats } from './descriptions/character-stats';
import { ClarityDescription } from './descriptions/descriptionInterface';

export type ClarityAction = ActionType<typeof actions>;

export interface ClarityState {
  /**
   * Descriptions from community provided by Clarity API
   */
  descriptions?: ClarityDescription;

  /**
   * Information about character stat cooldown times.
   */
  characterStats?: ClarityCharacterStats;
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
    case getType(actions.loadCharacterStats): {
      const characterStats = action.payload;
      return {
        ...state,
        characterStats: characterStats ?? state.characterStats,
      };
    }
    default:
      return state;
  }
};
