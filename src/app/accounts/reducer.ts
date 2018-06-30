import { combineReducers } from 'redux';
import { DestinyAccount } from './destiny-account.service';
import { AccountsAction, AccountsActions } from './actions';

export interface AccountsState {
  readonly accounts: ReadonlyArray<DestinyAccount>;
  // TODO: just the ID?
  readonly currentAccount?: DestinyAccount;
}

export const initialAccountsState: AccountsState = {
  accounts: []
};

export const accounts = combineReducers<AccountsState>({
  accounts: (
    state: AccountsState['accounts'] = [],
    action: AccountsAction
  ) => {
    switch (action.type) {
      case AccountsActions.SET:
        return {
          ...state,
          accounts: action.accounts
        };
        break;

      default:
        return state;
    }
  }
});
