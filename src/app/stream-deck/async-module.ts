// async module

// serialize the data and send it if connected
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { currentStoreSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { Loadout, LoadoutItem } from 'app/loadout-drawer/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { RootState, ThunkResult } from 'app/store/types';
import {
  streamDeckClearSelection,
  streamDeckConnected,
  streamDeckDisconnected,
  streamDeckUpdatePopupShowed,
} from 'app/stream-deck/actions';
import { randomStringToken } from 'app/stream-deck/AuthorizationNotification/AuthorizationNotification';
import { SendToStreamDeckArgs } from 'app/stream-deck/interfaces';
import { handleStreamDeckMessage, notificationPromise } from 'app/stream-deck/msg-handlers';
import { streamDeck } from 'app/stream-deck/reducer';
import { streamDeckUpdatePopupSelector } from 'app/stream-deck/selectors';
import {
  clientIdentifier,
  setClientIdentifier,
  setStreamDeckFlowVersion,
  streamDeckEnabled,
  streamDeckFlowVersion,
} from 'app/stream-deck/util/local-storage';
import packager from 'app/stream-deck/util/packager';
import { infoLog } from 'app/utils/log';
import { observeStore } from 'app/utils/redux-utils';
import { DamageType, DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';

let streamDeckWebSocket: WebSocket;

let refreshInterval: number;

// generate random client identifier
function generateIdentifier() {
  if (!clientIdentifier()) {
    setClientIdentifier(randomStringToken());
  }
}

export function sendToStreamDeck(msg: SendToStreamDeckArgs): ThunkResult {
  return async () => {
    if (streamDeckWebSocket?.readyState === WebSocket.OPEN) {
      streamDeckWebSocket.send(
        JSON.stringify({
          ...msg,
        })
      );
    }
  };
}

// on click on InventoryItem send the selected item to the Stream Deck
function streamDeckSelectItem(item: DimItem): ThunkResult {
  return async (dispatch, getState) => {
    const { streamDeck } = getState();
    if (streamDeck.selection === 'item' && !item.notransfer) {
      // hide the item popup that will be opened on classic item click
      hideItemPopup();
      // hide the notification
      notificationPromise.resolve();
      // clear the selection state in the store
      dispatch(streamDeckClearSelection());
      // send selection to the Stream Deck
      return dispatch(
        sendToStreamDeck({
          action: 'dim:selection',
          data: {
            selectionType: 'item',
            selection: {
              label: item.name,
              subtitle: item.typeName,
              item: item.index.replace(/-.*/, ''),
              icon: item.icon,
              overlay: item.iconOverlay,
              isExotic: item.isExotic,
              inventory: item.location.accountWide,
              element:
                item.element?.enumValue === DamageType.Kinetic
                  ? undefined
                  : item.element?.displayProperties?.icon,
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
      notificationPromise.resolve();
      dispatch(streamDeckClearSelection());
      const isAnyClass = loadout.classType === DestinyClass.Unknown;
      return dispatch(
        sendToStreamDeck({
          action: 'dim:selection',
          data: {
            selectionType: 'loadout',
            selection: {
              label: loadout.name.toUpperCase(),
              loadout: loadout.id,
              subtitle: (isAnyClass ? '' : store.className) || loadout.notes || '-',
              character: isAnyClass ? undefined : store.id,
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
export function refreshStreamDeck(): ThunkResult {
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
            equippedItems: packager.equippedItems(store),
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

function checkPluginUpdate(): ThunkResult {
  return async (dispatch, getState) => {
    const alreadyShowed = streamDeckUpdatePopupSelector(getState());
    if (alreadyShowed) {
      return;
    }
    const version = streamDeckFlowVersion();
    if (version < 2) {
      showNotification({
        title: 'Elgato Stream Deck',
        body: t('StreamDeck.Authorization.Update'),
        type: 'error',
        duration: 200,
        onClick: notificationPromise.resolve,
        promise: notificationPromise.promise,
      });
    }
    dispatch(streamDeckUpdatePopupShowed());
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
      streamDeckWebSocket = new WebSocket(`ws://localhost:9120/${clientIdentifier()}`);

      streamDeckWebSocket.onopen = function () {
        // remove any older notification
        notificationPromise.resolve();
        // update the connection flow version
        setStreamDeckFlowVersion(2);
        // update the connection status
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
          // retry to re-connect after 2.5s
          window.setTimeout(initWS, 2500);
        }
      };

      streamDeckWebSocket.onmessage = function ({ data }) {
        dispatch(handleStreamDeckMessage(JSON.parse(data)));
      };

      streamDeckWebSocket.onerror = function () {
        dispatch(checkPluginUpdate());
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
  reducer: streamDeck,
};
