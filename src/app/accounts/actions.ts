import { DestinyAccount } from "./destiny-account.service";

export enum AccountsActions {
  SET = 'SET',
  OTHER = '__any_other_action_type__'
}

export interface SetAccountsAction {
  type: AccountsActions.SET;
  accounts: DestinyAccount[];
}

export function setAccounts(accounts: DestinyAccount[]): SetAccountsAction {
  return {
    type: AccountsActions.SET,
    accounts
  };
}

export type AccountsAction =
  | SetAccountsAction;
