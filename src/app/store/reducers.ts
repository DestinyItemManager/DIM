import { combineReducers, AnyAction, Reducer } from 'redux';
import { settings } from '../settings/reducer';
import { AccountsState, accounts, currentAccountSelector } from '../accounts/reducer';
import { InventoryState, inventory } from '../inventory/reducer';
import { ShellState, shell } from '../shell/reducer';
import { ReviewsState, reviews } from '../item-review/reducer';
import { LoadoutsState, loadouts } from '../loadout/reducer';
import { WishListsState, wishLists } from '../wishlists/reducer';
import { FarmingState, farming } from '../farming/reducer';
import { ManifestState, manifest } from '../manifest/reducer';
import { DimApiState, dimApi, initialState as dimApiInitialState } from '../dim-api/reducer';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { VendorDropsState, vendorDrops } from 'app/vendorEngramsXyzApi/reducer';
import { Settings } from 'app/settings/initial-settings';

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

export type ThunkResult<R = void> = ThunkAction<Promise<R>, RootState, {}, AnyAction>;
export type ThunkDispatchProp = {
  dispatch: ThunkDispatch<RootState, {}, AnyAction>;
};

const reducer: Reducer<RootState> = (state, action) => {
  const combinedReducers = combineReducers({
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
    // Dummy reducer to get the types to work
    dimApi: (state: DimApiState = dimApiInitialState) => state
  });

  const intermediateState = combinedReducers(state, action);

  // Run the DIM API reducer last, and provide the current account along with it
  const dimApiState = dimApi(
    intermediateState.dimApi,
    action,
    currentAccountSelector(intermediateState)
  );

  if (intermediateState.dimApi !== dimApiState) {
    return {
      ...intermediateState,
      dimApi: dimApiState
    };
  }

  return intermediateState;
};

export default reducer;
