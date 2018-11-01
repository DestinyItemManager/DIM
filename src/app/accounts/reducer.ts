import { Reducer } from 'redux';
import { DestinyAccount } from './destiny-account.service';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { RootState } from '../store/reducers';

export const currentAccountSelector = (state: RootState) =>
  state.accounts.currentAccount === -1
    ? undefined
    : state.accounts.accounts[state.accounts.currentAccount];

export const destinyVersionSelector = (state: RootState) => {
  const currentAccount = currentAccountSelector(state);
  return (currentAccount && currentAccount.destinyVersion) || 2;
};

export interface AccountsState {
  readonly accounts: ReadonlyArray<DestinyAccount>;
  // TODO: just the ID?
  readonly currentAccount: number;
}

export type AccountsAction = ActionType<typeof actions>;

const initialState: AccountsState = {
  accounts: [],
  currentAccount: -1
};

export const accounts: Reducer<AccountsState, AccountsAction> = (
  state: AccountsState = initialState,
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
