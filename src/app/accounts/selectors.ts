import { RootState } from 'app/store/types';

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
