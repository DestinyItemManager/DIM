import { DestinyAccount } from './destiny-account';
import { createStandardAction } from 'typesafe-actions';

export const accountsLoaded = createStandardAction('accounts/ACCOUNTS_LOADED')<DestinyAccount[]>();
export const setCurrentAccount = createStandardAction('accounts/SET_CURRENT_ACCOUNT')<
  DestinyAccount | undefined
>();

export const loadFromIDB = createStandardAction('accounts/LOAD_FROM_IDB')<DestinyAccount[]>();
