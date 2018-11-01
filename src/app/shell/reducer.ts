import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { isPhonePortrait } from '../mediaQueries';
import { RootState } from '../store/reducers';

export const querySelector = (state: RootState) => state.shell.searchQuery;

export interface ShellState {
  readonly isPhonePortrait: boolean;
  readonly searchQuery: string;
}

export type ShellAction = ActionType<typeof actions>;

const initialState: ShellState = {
  isPhonePortrait: isPhonePortrait(),
  searchQuery: ''
};

export const shell: Reducer<ShellState, ShellAction> = (
  state: ShellState = initialState,
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
