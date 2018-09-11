import { Reducer } from 'redux';
import { DestinyAccount } from './destiny-account.service';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';

export interface AccountsState {
  readonly accounts: ReadonlyArray<DestinyAccount>;
  // TODO: just the ID?
  readonly currentAccount: number;
}

export type AccountsAction = ActionType<typeof actions>;

export const initialAccountsState: AccountsState = {
  accounts: [],
  currentAccount: -1
};

export const accounts: Reducer<AccountsState, AccountsAction> = (
  state: AccountsState = initialAccountsState,
  action: AccountsAction
) => {
  switch (action.type) {
    case getType(actions.accountsLoaded):
      return {
        ...state,
        accounts: action.payload
      };
    case getType(actions.setCurrentAccount):
      return {
        ...state,
        currentAccount: state.accounts.indexOf(action.payload)
      };
    default:
      return state;
  }
};
