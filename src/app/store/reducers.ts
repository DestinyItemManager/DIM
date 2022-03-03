import { accounts } from 'app/accounts/reducer';
import { currentAccountSelector } from 'app/accounts/selectors';
import { compare } from 'app/compare/reducer';
import { dimApi, DimApiState, initialState as dimApiInitialState } from 'app/dim-api/reducer';
import { farming } from 'app/farming/reducer';
import { inventory } from 'app/inventory/reducer';
import { loadouts } from 'app/loadout/reducer';
import { manifest } from 'app/manifest/reducer';
import { shell } from 'app/shell/reducer';
import { vendors } from 'app/vendors/reducer';
import { wishLists } from 'app/wishlists/reducer';
import { combineReducers, Reducer } from 'redux';
import { RootState } from './types';

const reducer: Reducer<RootState> = (state, action) => {
  const combinedReducers = combineReducers({
    accounts,
    inventory,
    shell,
    loadouts,
    wishLists,
    farming,
    manifest,
    vendors,
    compare,
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
