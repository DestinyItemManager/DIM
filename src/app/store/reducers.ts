import { combineReducers } from 'redux';
import { SettingsState, settings } from '../settings/reducer';
import { AccountsState, accounts } from '../accounts/reducer';
import { InventoryState, inventory } from '../inventory/reducer';

// See https://github.com/piotrwitek/react-redux-typescript-guide#redux

export interface RootState {
  readonly settings: SettingsState;
  readonly accounts: AccountsState;
  readonly inventory: InventoryState;
}

export default combineReducers({
  settings,
  accounts,
  inventory
});
