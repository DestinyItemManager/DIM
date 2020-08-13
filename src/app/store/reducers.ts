import { combineReducers, Reducer } from 'redux';
import { accounts } from '../accounts/reducer';
import { inventory } from '../inventory/reducer';
import { shell } from '../shell/reducer';
import { reviews } from '../item-review/reducer';
import { loadouts } from '../loadout/reducer';
import { wishLists } from '../wishlists/reducer';
import { farming } from '../farming/reducer';
import { manifest } from '../manifest/reducer';
import { DimApiState, dimApi, initialState as dimApiInitialState } from '../dim-api/reducer';
import { vendorDrops } from 'app/vendorEngramsXyzApi/reducer';
import { vendors } from 'app/vendors/reducer';
import { RootState } from './types';
import { currentAccountSelector } from 'app/accounts/selectors';

const reducer: Reducer<RootState> = (state, action) => {
  const combinedReducers = combineReducers({
    accounts,
    inventory,
    reviews,
    shell,
    loadouts,
    wishLists,
    farming,
    manifest,
    vendorDrops,
    vendors,
    // Dummy reducer to get the types to work
    dimApi: (state: DimApiState = dimApiInitialState) => state,
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
      dimApi: dimApiState,
    };
  }

  return intermediateState;
};

export default reducer;
