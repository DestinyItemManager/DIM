import { DestinyAccount } from './destiny-account';
import { createAction } from 'typesafe-actions';
import { DimError } from 'app/bungie-api/bungie-service-helper';

export const accountsLoaded = createAction('accounts/ACCOUNTS_LOADED')<DestinyAccount[]>();
export const setCurrentAccount = createAction('accounts/SET_CURRENT_ACCOUNT')<
  DestinyAccount | undefined
>();

export const loadFromIDB = createAction('accounts/LOAD_FROM_IDB')<DestinyAccount[]>();

export const error = createAction('accounts/ERROR')<DimError>();

export const loggedOut = createAction('accounts/LOG_OUT', (reauth?: boolean) => ({
  reauth: reauth || false
}))();

export const needsDeveloper = createAction('accounts/DEV_INFO_NEEDED')();
