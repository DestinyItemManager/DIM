// async module
import { currentStoreSelector } from 'app/inventory/selectors';
import { observe, unobserve } from 'app/store/observerMiddleware';
import { RootState, ThunkResult } from 'app/store/types';
import { streamDeckConnected, streamDeckDisconnected } from 'app/stream-deck/actions';
import { SendToStreamDeckArgs, StreamDeckMessage } from 'app/stream-deck/interfaces';
import { handleStreamDeckMessage } from 'app/stream-deck/msg-handlers';
import packager from 'app/stream-deck/util/packager';
import useSelection from './useStreamDeckSelection';

const STREAM_DECK_FARMING_OBSERVER_ID = 'stream-deck-farming-observer';

const STREAM_DECK_INVENTORY_OBSERVER_ID = 'stream-deck-inventory-observer';

let websocket: WebSocket;

export async function sendToStreamDeck(msg: SendToStreamDeckArgs) {
  if (websocket?.readyState === WebSocket.OPEN) {
    websocket.send(
      JSON.stringify({
        ...msg,
      }),
    );
  }
}

// collect and send data to the stream deck
function refreshStreamDeck(state: RootState) {
  if (websocket.readyState === WebSocket.OPEN) {
    const store = currentStoreSelector(state);
    store &&
      sendToStreamDeck({
        action: 'state',
        data: {
          character: packager.character(store),
          postmaster: packager.postmaster(store),
          metrics: packager.metrics(state),
          vault: packager.vault(state),
          inventory: packager.inventoryCounters(state),
          maxPower: packager.maxPower(store, state),
          equippedItems: packager.equippedItems(store),
        },
      });
  }
}

// stop the websocket's connection with the local stream deck instance
function stop(): ThunkResult {
  return async (dispatch) => {
    websocket?.close();
    dispatch(streamDeckDisconnected());
  };
}

// observe farming mode/inventory changes
function registerObservers(): ThunkResult {
  return async (dispatch) => {
    // farming mode
    dispatch(
      observe({
        id: STREAM_DECK_FARMING_OBSERVER_ID,
        runInitially: true,
        getObserved: (rootState) => rootState.farming.storeId,
        sideEffect: ({ current }) => {
          sendToStreamDeck({
            action: 'farmingMode',
            data: Boolean(current),
          });
        },
      }),
    );
    // inventory
    dispatch(
      observe({
        id: STREAM_DECK_INVENTORY_OBSERVER_ID,
        runInitially: true,
        getObserved: (rootState) => rootState.inventory,
        sideEffect: ({ rootState }) => refreshStreamDeck(rootState),
      }),
    );
  };
}

// start the websocket's connection with the local stream deck instance
function start(): ThunkResult {
  return async (dispatch, getState) => {
    const initWS = () => {
      const state = getState();

      // if settings/manifest/profile are not loaded retry after 1s
      if (
        !state.dimApi.globalSettingsLoaded ||
        !state.manifest.destiny2CoreSettings ||
        !state.inventory.profileResponse?.profileProgression
      ) {
        window.setTimeout(initWS, 1000);
        return;
      }

      const { enabled, auth } = state.streamDeck;

      // if stream deck is disabled stop and don't try to connect
      if (!enabled) {
        return;
      }

      // close the existing websocket if connected
      if (websocket?.readyState !== WebSocket.CLOSED) {
        websocket?.close();
      }

      // if the plugin is enabled but the auth is not set stop
      if (!auth) {
        return;
      }

      // try to connect to the stream deck local instance
      websocket = new WebSocket(`ws://localhost:9120/${auth.instance}`);

      websocket.onopen = () => {
        // update the connection status
        dispatch(streamDeckConnected());
        // register the observers
        dispatch(registerObservers());
      };

      websocket.onclose = () => {
        dispatch(streamDeckDisconnected());
        // if the plugin is still enabled and the websocket is closed
        if (enabled && websocket.readyState === WebSocket.CLOSED) {
          // retry to re-connect after 2.5s
          window.setTimeout(initWS, 2500);
        }
        // unregister the observers
        dispatch(unobserve(STREAM_DECK_FARMING_OBSERVER_ID));
        dispatch(unobserve(STREAM_DECK_INVENTORY_OBSERVER_ID));
      };

      websocket.onmessage = ({ data }) => {
        dispatch(
          handleStreamDeckMessage(JSON.parse(data as string) as StreamDeckMessage, auth.token),
        );
      };

      websocket.onerror = () => websocket.close();
    };

    initWS();
  };
}

// async module loaded in ./stream-deck.ts using lazy import
export default {
  start,
  stop,
  useSelection,
};
