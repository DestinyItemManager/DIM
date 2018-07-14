import { combineReducers } from 'redux';
import { SettingsState, settings } from '../settings/reducer';
import { AccountsState, accounts } from '../accounts/reducer';
import { InventoryState, inventory } from '../inventory/reducer';
import { ShellState, shell } from '../shell/reducer';

// See https://github.com/piotrwitek/react-redux-typescript-guide#redux

export interface RootState {
  readonly settings: SettingsState;
  readonly accounts: AccountsState;
  readonly inventory: InventoryState;
  readonly shell: ShellState;
}

export default combineReducers({
  settings,
  accounts,
  inventory,
  shell
});
