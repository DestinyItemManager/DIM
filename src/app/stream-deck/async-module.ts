// async module
import { currentStoreSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { refresh$ } from 'app/shell/refresh-events';
import store from 'app/store/store';
import { ThunkResult } from 'app/store/types';
import { streamDeckConnected, streamDeckDisconnected } from 'app/stream-deck/actions';
import { SendToStreamDeckArgs, StreamDeckMessage } from 'app/stream-deck/interfaces';
import { handleStreamDeckMessage } from 'app/stream-deck/msg-handlers';
import packager, { streamDeckClearId } from 'app/stream-deck/util/packager';
import { infoLog } from 'app/utils/log';
import { observeStore } from 'app/utils/redux';
import _ from 'lodash';

let websocket: WebSocket;

let refreshInterval: number;

export async function sendToStreamDeck(msg: SendToStreamDeckArgs) {
  if (websocket?.readyState === WebSocket.OPEN) {
    websocket.send(
      JSON.stringify({
        ...msg,
      }),
    );
  }
}

const installFarmingObserver = _.once(() => {
  const state = store.getState();
  // send initial state
  sendToStreamDeck({
    action: 'farmingMode',
    data: Boolean(state.farming.storeId),
  });
  // observe farming mode state
  observeStore(
    (state) => state.farming.storeId,
    (_, newState) => {
      sendToStreamDeck({
        action: 'farmingMode',
        data: Boolean(newState),
      });
    },
  );
});

// collect and send data to the stream deck
function refreshStreamDeck(): ThunkResult {
  return async (dispatch, getState) => {
    const refreshAction = () => {
      const state = getState();
      const store = currentStoreSelector(getState());
      if (!store) {
        return setTimeout(() => dispatch(refreshStreamDeck()), 1000);
      }
      sendToStreamDeck({
        action: 'state',
        data: {
          character: packager.character(store),
          postmaster: packager.postmaster(store),
          maxPower: packager.maxPower(store, state),
          vault: packager.vault(state),
          metrics: packager.metrics(state),
          equippedItems: packager.equippedItems(store),
        },
      });
    };
    clearInterval(refreshInterval);
    refreshInterval = window.setInterval(refreshAction, 30000);
    refreshAction();
  };
}

// stop the websocket's connection with the local stream deck instance
function stop(): ThunkResult {
  return async (dispatch) => {
    websocket?.close();
    clearInterval(refreshInterval);
    dispatch(streamDeckDisconnected());
  };
}

// refresh the stream deck state on refresh events
const installRefreshObserver = _.once(() => {
  refresh$.subscribe(() => refreshStreamDeck());
});

// send the equipment status to the stream deck when the item is equipped/unequipped
function sendEquipmentStatus(itemId: string, target: DimStore): ThunkResult {
  return async (_, getState) => {
    const equipped = currentStoreSelector(getState()) === target;
    sendToStreamDeck({
      action: 'equipmentStatus',
      data: {
        itemId: streamDeckClearId(itemId),
        equipped,
      },
    });
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

      // install refresh observer
      installRefreshObserver();

      // try to connect to the stream deck local instance
      websocket = new WebSocket(`ws://localhost:9120/${auth.instance}`);

      websocket.onopen = function () {
        // update the connection status
        dispatch(streamDeckConnected());
        // start refreshing task with interval
        dispatch(refreshStreamDeck());
        // install farming mode observer
        installFarmingObserver();
      };

      websocket.onclose = function () {
        dispatch(streamDeckDisconnected());
        // stop refreshing the Stream Deck State
        clearInterval(refreshInterval);
        // if the plugin is still enabled and the websocket is closed
        if (enabled && websocket.readyState === WebSocket.CLOSED) {
          // retry to re-connect after 2.5s
          window.setTimeout(initWS, 2500);
        }
      };

      websocket.onmessage = function ({ data }) {
        dispatch(
          handleStreamDeckMessage(JSON.parse(data as string) as StreamDeckMessage, auth.token),
        );
      };

      websocket.onerror = function () {
        websocket.close();
      };
    };

    initWS();
  };
}

infoLog('stream deck', 'feature lazy loaded');

// async module loaded in ./stream-deck.ts using lazy import
export default {
  start,
  stop,
  sendEquipmentStatus,
};

export type SendEquipmentStatusStreamDeckFn = typeof sendEquipmentStatus;
