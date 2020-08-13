import { Reducer } from 'redux';
import { DestinyAccount } from './destiny-account';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { DimError } from 'app/bungie-api/bungie-service-helper';
import { deepEqual } from 'fast-equals';
import { API_KEY as DIM_API_KEY } from 'app/dim-api/dim-api-helper';
import { API_KEY as BUNGIE_API_KEY } from 'app/bungie-api/bungie-api-utils';
import { hasValidAuthTokens } from 'app/bungie-api/oauth-tokens';

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
      (!localStorage.getItem('oauthClientId') || !localStorage.getItem('oauthClientSecret'))),
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
        accountsError: undefined,
      };
    case getType(actions.setCurrentAccount): {
      const newCurrentAccount = action.payload ? state.accounts.indexOf(action.payload) : -1;
      return newCurrentAccount !== state.currentAccount
        ? {
            ...state,
            currentAccount: newCurrentAccount,
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
            loadedFromIDB: true,
          };
    case getType(actions.error):
      return {
        ...state,
        accountsError: action.payload,
      };
    case getType(actions.loggedOut):
      return {
        ...initialState,
        reauth: action.payload.reauth,
        needsLogin: true,
      };

    case getType(actions.needsDeveloper):
      return {
        ...state,
        needsDeveloper: true,
      };

    default:
      return state;
  }
};
