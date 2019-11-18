import { Reducer } from 'redux';
import { DestinyAccount } from './destiny-account';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { RootState, ThunkResult } from '../store/reducers';
import { observeStore } from 'app/utils/redux-utils';
import { set, get } from 'idb-keyval';

export const accountsSelector = (state: RootState) => state.accounts.accounts;

export const currentAccountSelector = (state: RootState) =>
  state.accounts.currentAccount === -1
    ? undefined
    : accountsSelector(state)[state.accounts.currentAccount];

export const destinyVersionSelector = (state: RootState) => {
  const currentAccount = currentAccountSelector(state);
  return currentAccount?.destinyVersion || 2;
};

export interface AccountsState {
  readonly accounts: readonly DestinyAccount[];
  // TODO: just the ID?
  readonly currentAccount: number;
  readonly loaded: boolean;
  readonly loadedFromIDB: boolean;
}

export type AccountsAction = ActionType<typeof actions>;

const initialState: AccountsState = {
  accounts: [],
  currentAccount: -1,
  loaded: false,
  loadedFromIDB: false
};

export const accounts: Reducer<AccountsState, AccountsAction> = (
  state: AccountsState = initialState,
  action: AccountsAction
) => {
  switch (action.type) {
    case getType(actions.accountsLoaded):
      return {
        ...state,
        accounts: action.payload || [],
        loaded: true
      };
    case getType(actions.setCurrentAccount):
      return {
        ...state,
        currentAccount: action.payload ? state.accounts.indexOf(action.payload) : -1
      };
    case getType(actions.loadFromIDB):
      return state.loaded
        ? state
        : {
            ...state,
            accounts: action.payload || [],
            loadedFromIDB: true
          };
    default:
      return state;
  }
};

export function saveAccountsToIndexedDB() {
  return observeStore(
    (state) => state.accounts,
    (currentState, nextState) => {
      if (nextState.loaded && nextState.accounts !== currentState.accounts) {
        set('accounts', nextState.accounts);
      }
    }
  );
}

export function loadAccountsFromIndexedDB(): ThunkResult<Promise<void>> {
  return async (dispatch) => {
    const accounts = await get<DestinyAccount[] | undefined>('accounts');

    dispatch(actions.loadFromIDB(accounts || []));
  };
}
