import { combineReducers } from 'redux';
import { DestinyAccount } from './destiny-account.service';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';

export interface AccountsState {
  readonly accounts: ReadonlyArray<DestinyAccount>;
  // TODO: just the ID?
  readonly currentAccount?: DestinyAccount;
}

export type AccountsAction = ActionType<typeof actions>;

export const initialAccountsState: AccountsState = {
  accounts: []
};

export const accounts = combineReducers<AccountsState>({
  accounts: (
    state: AccountsState['accounts'] = [],
    action: AccountsAction
  ) => {
    switch (action.type) {
      case getType(actions.set):
        return {
          ...state,
          accounts: action.payload
        };
        break;

      default:
        return state;
    }
  }
});
