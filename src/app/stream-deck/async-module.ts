// async module

// serialize the data and send it if connected
import { DimItem } from 'app/inventory/item-types';
import { currentStoreSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { Loadout, LoadoutItem } from 'app/loadout-drawer/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState, ThunkResult } from 'app/store/types';
import {
  streamDeckClearSelection,
  streamDeckConnected,
  streamDeckDisconnected,
} from 'app/stream-deck/actions';
import { SendToStreamDeckArgs } from 'app/stream-deck/interfaces';
import { handleStreamDeckMessage } from 'app/stream-deck/msg-handlers';
import {
  clientIdentifier,
  setClientIdentifier,
  streamDeckEnabled,
  streamDeckToken,
} from 'app/stream-deck/util/local-storage';
import packager from 'app/stream-deck/util/packager';
import { infoLog } from 'app/utils/log';
import { observeStore } from 'app/utils/redux-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';

let streamDeckWebSocket: WebSocket;

let refreshInterval: number;

// generate random client identifier
function generateIdentifier() {
  if (!clientIdentifier()) {
    setClientIdentifier(Math.random().toString(36).slice(2));
  }
}

export function sendToStreamDeck(msg: SendToStreamDeckArgs, noAuth = false): ThunkResult {
  return async () => {
    if (streamDeckWebSocket?.readyState === WebSocket.OPEN) {
      const token = streamDeckToken();
      (noAuth || token) &&
        streamDeckWebSocket.send(
          JSON.stringify({
            ...msg,
            token,
          })
        );
    }
  };
}

// on click on InventoryItem send the selected item to the Stream Deck
function streamDeckSelectItem(item: DimItem): ThunkResult {
  return async (dispatch, getState) => {
    const { streamDeck } = getState();
    if (streamDeck.selection === 'item') {
      // hide the item popup that will be opened on classic item click
      hideItemPopup();
      // hide the notification
      streamDeck.selectionPromise.resolve();
      // clear the selection state in the store
      dispatch(streamDeckClearSelection());
      // send selection to the Stream Deck
      return dispatch(
        sendToStreamDeck({
          action: 'dim:update',
          data: {
            selectionType: 'item',
            selection: {
              label: item.name,
              subtitle: item.typeName,
              item: item.id,
              icon: item.icon,
            },
          },
        })
      );
    }
  };
}

function findSubClass(items: LoadoutItem[], state: RootState) {
  const defs = d2ManifestSelector(state);
  for (const item of items) {
    const def = defs?.InventoryItem.get(item.hash);
    // find subclass item
    if (def?.inventory?.bucketTypeHash === BucketHashes.Subclass) {
      return def.displayProperties.icon;
    }
  }
}

// on click on LoadoutView send the selected loadout and the related character identifier to the Stream Deck
function streamDeckSelectLoadout(loadout: Loadout, store: DimStore): ThunkResult {
  return async (dispatch, getState) => {
    const state = getState();
    if (state.streamDeck.selection === 'loadout') {
      state.streamDeck.selectionPromise.resolve();
      dispatch(streamDeckClearSelection());
      return dispatch(
        sendToStreamDeck({
          action: 'dim:update',
          data: {
            selectionType: 'loadout',
            selection: {
              label: loadout.name,
              loadout: loadout.id,
              subtitle: store.className ?? loadout.notes,
              character: store.id,
              icon: findSubClass(loadout.items, state),
            },
          },
        })
      );
    }
  };
}

const installFarmingObserver = _.once((dispatch) => {
  observeStore(
    (state) => state.farming.storeId,
    (_, newState) => {
      dispatch(
        sendToStreamDeck({
          action: 'dim:update',
          data: {
            farmingMode: Boolean(newState),
          },
        })
      );
    }
  );
});

// collect and send data to the stream deck
function refreshStreamDeck(): ThunkResult {
  return async (dispatch, getState) => {
    const refreshAction = () => {
      const state = getState();
      const store = currentStoreSelector(getState());
      if (!store) {
        return;
      }
      dispatch(
        sendToStreamDeck({
          action: 'dim:update',
          data: {
            postmaster: packager.postmaster(store),
            maxPower: packager.maxPower(store, state),
            vault: packager.vault(state),
            metrics: packager.metrics(state),
          },
        })
      );
    };
    clearInterval(refreshInterval);
    refreshInterval = window.setInterval(refreshAction, 30000);
    refreshAction();
  };
}

// stop the websocket's connection with the local stream deck instance
function stopStreamDeckConnection(): ThunkResult {
  return async (dispatch) => {
    streamDeckWebSocket?.close();
    clearInterval(refreshInterval);
    dispatch(streamDeckDisconnected());
  };
}

// start the websocket's connection with the local stream deck instance
function startStreamDeckConnection(): ThunkResult {
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

      // ensure identifier exists
      generateIdentifier();

      // if stream deck is disabled stop and don't try to connect
      if (!streamDeckEnabled()) {
        return;
      }

      installFarmingObserver(dispatch);

      // close the existing websocket if connected
      if (streamDeckWebSocket && streamDeckWebSocket.readyState !== WebSocket.CLOSED) {
        streamDeckWebSocket.close();
      }

      // try to connect to the stream deck local instance
      streamDeckWebSocket = new WebSocket('wss://localhost:9119', clientIdentifier());

      streamDeckWebSocket.onopen = function () {
        dispatch(streamDeckConnected());
        // start refreshing task with interval
        dispatch(refreshStreamDeck());
      };

      streamDeckWebSocket.onclose = function () {
        dispatch(streamDeckDisconnected());
        // stop refreshing the Stream Deck State
        clearInterval(refreshInterval);
        // if the plugin is still enabled and the websocket is closed
        if (streamDeckEnabled() && streamDeckWebSocket.readyState === WebSocket.CLOSED) {
          // retry to re-connect after 5s
          window.setTimeout(initWS, 5000);
        }
      };

      streamDeckWebSocket.onmessage = function ({ data }) {
        dispatch(handleStreamDeckMessage(JSON.parse(data)));
      };

      streamDeckWebSocket.onerror = function () {
        streamDeckWebSocket.close();
      };
    };

    initWS();
  };
}

function resetIdentifierOnStreamDeck() {
  sendToStreamDeck({
    action: 'authorization:reset',
  });
}

infoLog('stream deck', 'feature lazy loaded');

// async module loaded in ./stream-deck.ts using lazy import
export default {
  startStreamDeckConnection,
  stopStreamDeckConnection,
  streamDeckSelectItem,
  streamDeckSelectLoadout,
  resetIdentifierOnStreamDeck,
};
