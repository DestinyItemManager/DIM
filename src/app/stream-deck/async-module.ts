// async module
import { t } from 'app/i18next-t';
import { currentStoreSelector } from 'app/inventory/selectors';
import { showNotification } from 'app/notifications/notifications';
import { observe, unobserve } from 'app/store/observerMiddleware';
import { RootState, ThunkResult } from 'app/store/types';
import {
  streamDeckApprovalRequired,
  streamDeckChecking,
  streamDeckConnected,
  streamDeckDisconnected,
} from 'app/stream-deck/actions';
import { SendToStreamDeckArgs, StreamDeckMessage } from 'app/stream-deck/interfaces';
import { handleStreamDeckMessage } from 'app/stream-deck/msg-handlers';
import { errorMessage } from 'app/utils/errors';
import { reportException } from 'app/utils/sentry';
import useSelection from './useStreamDeckSelection';
import {
  character,
  equippedItems,
  inventoryCounters,
  maxPower,
  metrics,
  postmaster,
  vault,
} from './util/packager';

const STREAM_DECK_FARMING_OBSERVER_ID = 'stream-deck-farming-observer';

const STREAM_DECK_INVENTORY_OBSERVER_ID = 'stream-deck-inventory-observer';

let websocket: WebSocket;
let connectionAttempt = 0;
let verificationTimeout: number | undefined;

export async function sendToStreamDeck(msg: SendToStreamDeckArgs) {
  if (websocket?.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(msg));
  }
}

let errorNotified = false;

// collect and send data to the stream deck
function refreshStreamDeck(state: RootState) {
  if (websocket.readyState === WebSocket.OPEN) {
    try {
      const store = currentStoreSelector(state);
      store &&
        sendToStreamDeck({
          action: 'state',
          data: {
            character: character(store),
            postmaster: postmaster(store),
            metrics: metrics(state),
            vault: vault(state),
            inventory: inventoryCounters(state),
            maxPower: maxPower(store, state),
            equippedItems: equippedItems(store),
          },
        });
    } catch (e) {
      reportException('streamdeck', e);
      if (!errorNotified) {
        showNotification({
          type: 'error',
          title: t('StreamDeck.Error.Title'),
          body: t('StreamDeck.Error.Body', { error: errorMessage(e) }),
          duration: 10000,
        });
        errorNotified = true;
      }
    }
  }
}

// stop the websocket's connection with the local stream deck instance
function stop(): ThunkResult {
  return async (dispatch) => {
    connectionAttempt++;
    window.clearTimeout(verificationTimeout);
    websocket?.close();
    dispatch(unobserve(STREAM_DECK_FARMING_OBSERVER_ID));
    dispatch(unobserve(STREAM_DECK_INVENTORY_OBSERVER_ID));
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
    const attempt = ++connectionAttempt;
    window.clearTimeout(verificationTimeout);
    const { enabled, auth } = getState().streamDeck;
    if (!enabled) {
      return;
    }
    if (!auth?.instance || !auth.token) {
      dispatch(streamDeckApprovalRequired(true));
    }
    dispatch(streamDeckChecking());
    const instance = auth?.instance || globalThis.crypto.randomUUID();
    const initWS = () => {
      if (attempt !== connectionAttempt) {
        return;
      }
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

      // try to connect to the stream deck local instance
      websocket = new WebSocket(`ws://localhost:9120/${instance}`, 'dim-status');

      let observing = false;
      websocket.onopen = () => {
        if (attempt !== connectionAttempt) {
          return;
        }
        // update the connection status
        dispatch(streamDeckConnected());
        // Older plugins may not send a status response. Never assume authorization.
        verificationTimeout = window.setTimeout(() => {
          if (attempt === connectionAttempt) {
            dispatch(streamDeckApprovalRequired(true));
          }
        }, 5000);
      };

      websocket.onclose = () => {
        if (attempt !== connectionAttempt) {
          return;
        }
        window.clearTimeout(verificationTimeout);
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
        if (attempt !== connectionAttempt) {
          return;
        }
        window.clearTimeout(verificationTimeout);
        const message = JSON.parse(data as string) as StreamDeckMessage;
        dispatch(handleStreamDeckMessage(message, auth?.token));
        if (auth?.token && message.token === auth.token && !observing) {
          observing = true;
          dispatch(registerObservers());
        }
      };

      const socket = websocket;
      socket.onerror = () => socket.close();
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
