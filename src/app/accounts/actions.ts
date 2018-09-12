import { DestinyAccount } from './destiny-account.service';
import { createStandardAction } from 'typesafe-actions';

export const accountsLoaded = createStandardAction('accounts/ACCOUNTS_LOADED')<DestinyAccount[]>();
export const setCurrentAccount = createStandardAction('accounts/SET_CURRENT_ACCOUNT')<
  DestinyAccount
>();
