import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { API_KEY as BUNGIE_API_KEY } from 'app/bungie-api/bungie-api-utils';
import { hasValidAuthTokens } from 'app/bungie-api/oauth-tokens';
import { API_KEY as DIM_API_KEY } from 'app/dim-api/dim-api-helper';
import { deepEqual } from 'fast-equals';
import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './actions';
import { DestinyAccount } from './destiny-account';

export interface AccountsState {
  /**
   * A list of all accounts loaded from Bungie.net.
   */
  readonly accounts: readonly DestinyAccount[];
  /**
   * Platform Membership ID of the currently selected account. This may not
   * correspond to any account in the accounts array!
   */
  readonly currentAccountMembershipId: string | undefined;
  /** Destiny version of the currently selected account */
  readonly currentAccountDestinyVersion: DestinyVersion | undefined;

  /** Have we loaded from Bungie.net? */
  readonly loaded: boolean;
  /** Have we loaded a cached version from IndexedDB? */
  readonly loadedFromIDB: boolean;

  /** Any error loading from Bungie.net */
  // TODO: is this overused?
  readonly accountsError?: Error;

  /** Do we need the user to log in? */
  readonly needsLogin: boolean;
  /** Do we need the user to input developer info (dev only)? */
  readonly needsDeveloper: boolean;
}

export type AccountsAction = ActionType<typeof actions>;

function getLastAccountFromLocalStorage() {
  const currentAccountMembershipId = localStorage.getItem('dim-last-membership-id') ?? undefined;
  const destinyVersionStr = localStorage.getItem('dim-last-destiny-version') ?? undefined;
  const currentAccountDestinyVersion = destinyVersionStr
    ? (parseInt(destinyVersionStr, 10) as DestinyVersion)
    : 2;
  return { currentAccountMembershipId, currentAccountDestinyVersion };
}

const initialState: AccountsState = {
  accounts: [],
  ...getLastAccountFromLocalStorage(),
  loaded: false,
  loadedFromIDB: false,
  needsLogin: !hasValidAuthTokens(),
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
      // TODO: Maybe merge them? if there's D1 but no D2...
      return {
        ...state,
        accounts: deepEqual(action.payload, state.accounts) ? state.accounts : action.payload || [],
        loaded: true,
        accountsError: undefined,
      };
    case getType(actions.setCurrentAccount): {
      const { membershipId, destinyVersion } = action.payload;
      const changed =
        membershipId !== state.currentAccountMembershipId ||
        destinyVersion !== state.currentAccountDestinyVersion;
      return changed
        ? {
            ...state,
            currentAccountMembershipId: membershipId,
            currentAccountDestinyVersion: destinyVersion,
          }
        : state;
    }
    case getType(actions.loadFromIDB):
      // TODO: maybe merge them?
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
