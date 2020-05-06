import { Reducer } from 'redux';
import { DestinyAccount } from './destiny-account';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { RootState, ThunkResult } from '../store/reducers';
import { observeStore } from 'app/utils/redux-utils';
import { set, get } from 'idb-keyval';
import { dedupePromise } from 'app/utils/util';
import { DimError } from 'app/bungie-api/bungie-service-helper';
import { deepEqual } from 'fast-equals';
import { API_KEY as DIM_API_KEY } from 'app/dim-api/dim-api-helper';
import { API_KEY as BUNGIE_API_KEY } from 'app/bungie-api/bungie-api-utils';
import { hasValidAuthTokens } from 'app/bungie-api/oauth-tokens';

export const accountsSelector = (state: RootState) => state.accounts.accounts;

export const currentAccountSelector = (state: RootState) =>
  state.accounts.currentAccount === -1
    ? undefined
    : accountsSelector(state)[state.accounts.currentAccount];

export const destinyVersionSelector = (state: RootState) => {
  const currentAccount = currentAccountSelector(state);
  return currentAccount?.destinyVersion || 2;
};

/** Are the accounts loaded enough to use? */
export const accountsLoadedSelector = (state: RootState) =>
  state.accounts.loaded || (state.accounts.loadedFromIDB && accountsSelector(state).length > 0);

export interface AccountsState {
  readonly accounts: readonly DestinyAccount[];
  // TODO: just the ID?
  readonly currentAccount: number;
  readonly loaded: boolean;
  readonly loadedFromIDB: boolean;

  readonly accountsError?: DimError;

  /** Do we need the user to log in? */
  readonly needsLogin: boolean;
  /** Should we force the auth choice when logging in? */
  readonly reauth: boolean;
  /** Do we need the user to input developer info (dev only)? */
  readonly needsDeveloper: boolean;
}

export type AccountsAction = ActionType<typeof actions>;

const initialState: AccountsState = {
  accounts: [],
  currentAccount: -1,
  loaded: false,
  loadedFromIDB: false,
  needsLogin: !hasValidAuthTokens(),
  reauth: false,
  needsDeveloper:
    !DIM_API_KEY ||
    !BUNGIE_API_KEY ||
    ($DIM_FLAVOR === 'dev' &&
      (!localStorage.getItem('oauthClientId') || !localStorage.getItem('oauthClientSecret')))
};

export const accounts: Reducer<AccountsState, AccountsAction> = (
  state: AccountsState = initialState,
  action: AccountsAction
) => {
  switch (action.type) {
    case getType(actions.accountsLoaded):
      return {
        ...state,
        accounts: deepEqual(action.payload, state.accounts) ? state.accounts : action.payload || [],
        loaded: true,
        accountsError: undefined
      };
    case getType(actions.setCurrentAccount): {
      const newCurrentAccount = action.payload ? state.accounts.indexOf(action.payload) : -1;
      return newCurrentAccount !== state.currentAccount
        ? {
            ...state,
            currentAccount: newCurrentAccount
          }
        : state;
    }
    case getType(actions.loadFromIDB):
      return state.loaded
        ? state
        : {
            ...state,
            accounts: deepEqual(action.payload, state.accounts)
              ? state.accounts
              : action.payload || [],
            loadedFromIDB: true
          };
    case getType(actions.error):
      return {
        ...state,
        accountsError: action.payload
      };
    case getType(actions.loggedOut):
      return {
        ...initialState,
        reauth: action.payload.reauth,
        needsLogin: true
      };

    case getType(actions.needsDeveloper):
      return {
        ...state,
        needsDeveloper: true
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

const loadAccountsFromIndexedDBAction: ThunkResult = dedupePromise(async (dispatch) => {
  console.log('Load accounts from IDB');
  const accounts = await get<DestinyAccount[] | undefined>('accounts');

  dispatch(actions.loadFromIDB(accounts || []));
});

export function loadAccountsFromIndexedDB(): ThunkResult {
  return loadAccountsFromIndexedDBAction;
}
