import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';

export interface ShellState {
  readonly isPhonePortrait: boolean;
}

export type ShellAction = ActionType<typeof actions>;

export const initialAccountsState: ShellState = {
  isPhonePortrait: false
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
    default:
      return state;
  }
};
