import { currentAccountSelector } from 'app/accounts/selectors';
import { vendors } from 'app/vendors/reducer';
import { combineReducers, Reducer } from 'redux';
import { accounts } from '../accounts/reducer';
import { compare } from '../compare/reducer';
import { dimApi, DimApiState, initialState as dimApiInitialState } from '../dim-api/reducer';
import { farming } from '../farming/reducer';
import { inventory } from '../inventory/reducer';
import { loadouts } from '../loadout/reducer';
import { manifest } from '../manifest/reducer';
import { shell } from '../shell/reducer';
import { wishLists } from '../wishlists/reducer';
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
