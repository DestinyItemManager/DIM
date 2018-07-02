import { combineReducers } from 'redux';
import { SettingsState, initialSettingsState, settings } from '../settings/reducer';
import { initialAccountsState, AccountsState, accounts } from '../accounts/reducer';

// See https://github.com/piotrwitek/react-redux-typescript-guide#redux

export interface RootState {
  readonly settings: SettingsState;
  readonly accounts: AccountsState;
}

export const initialState: RootState = {
  settings: initialSettingsState,
  accounts: initialAccountsState
};

export default combineReducers({
  settings,
  accounts
});
