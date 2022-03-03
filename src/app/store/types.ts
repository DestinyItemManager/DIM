import type { AccountsState } from 'app/accounts/reducer';
import type { CompareState } from 'app/compare/reducer';
import type { DimApiState } from 'app/dim-api/reducer';
import type { FarmingState } from 'app/farming/reducer';
import type { InventoryState } from 'app/inventory/reducer';
import type { LoadoutsState } from 'app/loadout/reducer';
import type { ManifestState } from 'app/manifest/reducer';
import type { ShellState } from 'app/shell/reducer';
import type { VendorsState } from 'app/vendors/reducer';
import type { WishListsState } from 'app/wishlists/reducer';
import { DefaultRootState } from 'react-redux';
import type { AnyAction } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';

// See https://github.com/piotrwitek/react-redux-typescript-guide#redux

declare module 'react-redux' {
  interface DefaultRootState {
    readonly accounts: AccountsState;
    readonly inventory: InventoryState;
    readonly shell: ShellState;
    readonly loadouts: LoadoutsState;
    readonly wishLists: WishListsState;
    readonly farming: FarmingState;
    readonly manifest: ManifestState;
    readonly vendors: VendorsState;
    readonly compare: CompareState;
    readonly dimApi: DimApiState;
  }
}

export type RootState = DefaultRootState;

export type ThunkResult<R = void> = ThunkAction<Promise<R>, RootState, undefined, AnyAction>;
export type DimThunkDispatch = ThunkDispatch<RootState, undefined, AnyAction>;
export type ThunkDispatchProp = {
  dispatch: DimThunkDispatch;
};
