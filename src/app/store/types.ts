import type { VendorDropsState } from 'app/vendorEngramsXyzApi/reducer';
import type { VendorsState } from 'app/vendors/reducer';
import type { AnyAction } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type { AccountsState } from '../accounts/reducer';
import type { DimApiState } from '../dim-api/reducer';
import type { FarmingState } from '../farming/reducer';
import type { InventoryState } from '../inventory/reducer';
import type { LoadoutsState } from '../loadout/reducer';
import type { ManifestState } from '../manifest/reducer';
import type { ShellState } from '../shell/reducer';
import type { WishListsState } from '../wishlists/reducer';

// See https://github.com/piotrwitek/react-redux-typescript-guide#redux

export interface RootState {
  readonly accounts: AccountsState;
  readonly inventory: InventoryState;
  readonly shell: ShellState;
  readonly loadouts: LoadoutsState;
  readonly wishLists: WishListsState;
  readonly farming: FarmingState;
  readonly manifest: ManifestState;
  readonly vendorDrops: VendorDropsState;
  readonly vendors: VendorsState;
  readonly dimApi: DimApiState;
}

export type ThunkResult<R = void> = ThunkAction<Promise<R>, RootState, undefined, AnyAction>;
export type DimThunkDispatch = ThunkDispatch<RootState, undefined, AnyAction>;
export type ThunkDispatchProp = {
  dispatch: DimThunkDispatch;
};
