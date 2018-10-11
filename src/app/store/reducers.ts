import { combineReducers } from 'redux';
import { settings, Settings } from '../settings/reducer';
import { AccountsState, accounts } from '../accounts/reducer';
import { InventoryState, inventory } from '../inventory/reducer';
import { ShellState, shell } from '../shell/reducer';
import { ReviewsState, reviews } from '../item-review/reducer';
import { LoadoutsState, loadouts } from '../loadout/reducer';

// See https://github.com/piotrwitek/react-redux-typescript-guide#redux

export interface RootState {
  readonly settings: Settings;
  readonly accounts: AccountsState;
  readonly inventory: InventoryState;
  readonly reviews: ReviewsState;
  readonly shell: ShellState;
  readonly loadouts: LoadoutsState;
}

export default combineReducers({
  settings,
  accounts,
  inventory,
  reviews,
  shell,
  loadouts
});
