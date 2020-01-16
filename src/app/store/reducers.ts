import { combineReducers, AnyAction } from 'redux';
import { settings, Settings } from '../settings/reducer';
import { AccountsState, accounts } from '../accounts/reducer';
import { InventoryState, inventory } from '../inventory/reducer';
import { ShellState, shell } from '../shell/reducer';
import { ReviewsState, reviews } from '../item-review/reducer';
import { LoadoutsState, loadouts } from '../loadout/reducer';
import { WishListsState, wishLists } from '../wishlists/reducer';
import { FarmingState, farming } from '../farming/reducer';
import { ManifestState, manifest } from '../manifest/reducer';
import { DimApiState, dimApi } from '../dim-api/reducer';
import { ThunkAction } from 'redux-thunk';
import { VendorDropsState, vendorDrops } from 'app/vendorEngramsXyzApi/reducer';

// See https://github.com/piotrwitek/react-redux-typescript-guide#redux

export interface RootState {
  readonly settings: Settings;
  readonly accounts: AccountsState;
  readonly inventory: InventoryState;
  readonly reviews: ReviewsState;
  readonly shell: ShellState;
  readonly loadouts: LoadoutsState;
  readonly wishLists: WishListsState;
  readonly farming: FarmingState;
  readonly manifest: ManifestState;
  readonly vendorDrops: VendorDropsState;
  readonly dimApi: DimApiState;
}

export type ThunkResult<R> = ThunkAction<R, RootState, {}, AnyAction>;

export default combineReducers({
  settings,
  accounts,
  inventory,
  reviews,
  shell,
  loadouts,
  wishLists,
  farming,
  manifest,
  vendorDrops,
  dimApi
});
