import { DestinyAccount } from './destiny-account';
import { createAction } from 'typesafe-actions';

export const accountsLoaded = createAction('accounts/ACCOUNTS_LOADED')<DestinyAccount[]>();
export const setCurrentAccount = createAction('accounts/SET_CURRENT_ACCOUNT')<
  DestinyAccount | undefined
>();

export const loadFromIDB = createAction('accounts/LOAD_FROM_IDB')<DestinyAccount[]>();
