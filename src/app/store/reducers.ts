import { currentAccountSelector } from 'app/accounts/selectors';
import { clarity } from 'app/clarity/reducer';
import {
  initialState as streamDeckInitialState,
  streamDeck,
  StreamDeckState,
} from 'app/stream-deck/reducer';
import { vendors } from 'app/vendors/reducer';
import { combineReducers, Reducer } from 'redux';
import { accounts } from '../accounts/reducer';
import { compare } from '../compare/reducer';
import { dimApi, DimApiState, initialState as dimApiInitialState } from '../dim-api/reducer';
import { farming } from '../farming/reducer';
import { inventory } from '../inventory/reducer';
import { loadouts } from '../loadout-drawer/reducer';
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
    clarity,
    // Dummy reducer to get the types to work
    dimApi: (state: DimApiState = dimApiInitialState) => state,
    streamDeck: (state: StreamDeckState = streamDeckInitialState) => state,
  });

  let intermediateState = combinedReducers(state, action);

  // Run the DIM API reducer last, and provide the current account along with it
  const dimApiState = dimApi(
    intermediateState.dimApi,
    action,
    currentAccountSelector(intermediateState)
  );

  // enable reducer for Stream Deck Feature only if enabled
  if ($featureFlags.elgatoStreamDeck) {
    const streamDeckState = streamDeck(intermediateState.streamDeck, action);
    if (streamDeckState !== intermediateState.streamDeck) {
      intermediateState = {
        ...intermediateState,
        streamDeck: streamDeckState,
      };
    }
  }

  if (intermediateState.dimApi !== dimApiState) {
    return {
      ...intermediateState,
      dimApi: dimApiState,
    };
  }

  return intermediateState;
};

export default reducer;
