import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { isPhonePortrait } from '../mediaQueries';

export interface ShellState {
  readonly isPhonePortrait: boolean;
  readonly searchQuery: string;
}

export type ShellAction = ActionType<typeof actions>;

export const initialAccountsState: ShellState = {
  isPhonePortrait: isPhonePortrait(),
  searchQuery: ''
};

export const shell: Reducer<ShellState, ShellAction> = (
  state: ShellState = initialAccountsState,
  action: ShellAction
) => {
  switch (action.type) {
    case getType(actions.setPhonePortrait):
      return {
        ...state,
        isPhonePortrait: action.payload
      };
    case getType(actions.setSearchQuery):
      return {
        ...state,
        searchQuery: action.payload
      };
    default:
      return state;
  }
};
