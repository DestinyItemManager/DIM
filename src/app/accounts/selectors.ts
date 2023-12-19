import { RootState } from 'app/store/types';

export const accountsSelector = (state: RootState) => state.accounts.accounts;

/**
 * Full details about the currently loaded account. This may be undefined if
 * there is no selected account, or if the selected account doesn't appear in
 * the list of loaded accounts.
 */
export const currentAccountSelector = (state: RootState) =>
  state.accounts.currentAccountMembershipId
    ? accountsSelector(state).find(
        (a) =>
          a.membershipId === state.accounts.currentAccountMembershipId &&
          a.destinyVersion === state.accounts.currentAccountDestinyVersion,
      )
    : undefined;

export const currentAccountMembershipIdSelector = (state: RootState) =>
  state.accounts.currentAccountMembershipId;

export const destinyVersionSelector = (state: RootState) =>
  state.accounts.currentAccountDestinyVersion ?? 2;

/** Are the accounts loaded enough to use? */
export const accountsLoadedSelector = (state: RootState) =>
  state.accounts.loaded || (state.accounts.loadedFromIDB && accountsSelector(state).length > 0);

export const hasD1AccountSelector = (state: RootState) =>
  accountsSelector(state).some((a) => a.destinyVersion === 1);
