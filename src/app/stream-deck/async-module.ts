// async module

// serialize the data and send it if connected
import { currentAccountSelector } from 'app/accounts/selectors';
import { createLoadoutShare } from 'app/dim-api/dim-api';
import { startFarming, stopFarming } from 'app/farming/actions';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import {
  allItemsSelector,
  currentStoreSelector,
  storesSelector,
  vaultSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getStore } from 'app/inventory/stores-helpers';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { itemMoveLoadout, maxLightLoadout, randomLoadout } from 'app/loadout-drawer/auto-loadouts';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { convertDimLoadoutToApiLoadout } from 'app/loadout-drawer/loadout-type-converters';
import { Loadout, LoadoutItem } from 'app/loadout-drawer/loadout-types';
import { pullFromPostmaster } from 'app/loadout-drawer/postmaster';
import { loadoutsSelector } from 'app/loadout-drawer/selectors';
import { loadoutShares } from 'app/loadout/loadout-share/LoadoutShareSheet';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { accountRoute } from 'app/routes';
import { filteredItemsSelector } from 'app/search/search-filter';
import { setRouterLocation, setSearchQuery } from 'app/shell/actions';
import { refresh } from 'app/shell/refresh-events';
import { RootState, ThunkResult } from 'app/store/types';
import {
  streamDeckClearSelection,
  streamDeckConnected,
  streamDeckDisconnected,
  streamDeckWaitSelection,
} from 'app/stream-deck/actions';
import {
  checkAuthorization,
  generateIdentifier,
} from 'app/stream-deck/authorization/authorization';
import { streamDeckEncrypt } from 'app/stream-deck/authorization/encryption';
import { SendToStreamDeckArgs } from 'app/stream-deck/interfaces';
import {
  clientIdentifier,
  streamDeckEnabled,
  streamDeckSharedKey,
} from 'app/stream-deck/util/local-storage';
import packager from 'app/stream-deck/util/packager';
import { infoLog } from 'app/utils/log';
import { observeStore } from 'app/utils/redux-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';

let streamDeckWebSocket: WebSocket;

let refreshInterval: number;

function sendToStreamDeck(args: SendToStreamDeckArgs): ThunkResult {
  return async () => {
    if (streamDeckWebSocket?.readyState === WebSocket.OPEN) {
      const sharedKey = streamDeckSharedKey();
      sharedKey && streamDeckWebSocket.send(streamDeckEncrypt(JSON.stringify(args), sharedKey));
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
          selectionType: 'item',
          selection: {
            label: item.name,
            subtitle: item.typeName,
            item: item.id,
            icon: item.icon,
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
          selectionType: 'loadout',
          selection: {
            label: loadout.name,
            loadout: loadout.id,
            subtitle: store.className ?? loadout.notes,
            character: store.id,
            icon: findSubClass(loadout.items, state),
          },
        })
      );
    }
  };
}

// Show notification asking for selection
function showSelectionNotification(
  state: RootState,
  selectionType: 'item' | 'loadout',
  onCancel?: () => void
) {
  // cancel previous selection notification
  state.streamDeck.selectionPromise.resolve();

  showNotification({
    title: 'Elgato Stream Deck',
    body:
      selectionType === 'item' ? t('StreamDeck.Selection.Item') : t('StreamDeck.Selection.Loadout'),
    type: 'info',
    duration: 500,
    onCancel,
    onClick: onCancel,
    promise: state.streamDeck.selectionPromise.promise,
  });
}

// handle actions coming from the stream deck instance
function handleStreamDeckMessage(msg: string): ThunkResult {
  return async (dispatch, getState) => {
    const state = getState();

    const data = checkAuthorization(msg, state.streamDeck, streamDeckWebSocket);

    // this is not an encrypted msg or a challenge string
    if (!data) {
      return;
    }

    const currentStore = currentStoreSelector(state);

    if (!currentStore) {
      return;
    }

    switch (data.action) {
      case 'refresh':
        return refresh();
      case 'search': {
        dispatch(setRouterLocation(routeTo(state, data.page || 'inventory')));
        if (data.pullItems) {
          const loadout = itemMoveLoadout(filteredItemsSelector(state), currentStore);
          return dispatch(applyLoadout(currentStore, loadout, { allowUndo: true }));
        } else {
          dispatch(setSearchQuery(data.search, true));
        }
        return;
      }
      case 'randomize': {
        const allItems = allItemsSelector(state);
        const loadout = randomLoadout(
          currentStore,
          allItems,
          data.weaponsOnly ? (i) => i.bucket?.sort === 'Weapons' : () => true
        );
        loadout && (await dispatch(applyLoadout(currentStore, loadout, { allowUndo: true })));
        return;
      }
      case 'collectPostmaster': {
        return dispatch(pullFromPostmaster(currentStore));
      }
      case 'farmingMode': {
        if (state.farming.storeId) {
          return dispatch(stopFarming());
        } else {
          return dispatch(startFarming(currentStore?.id));
        }
      }
      case 'maxPower': {
        const allItems = allItemsSelector(state);
        const loadout = maxLightLoadout(allItems, currentStore);
        return dispatch(applyLoadout(currentStore, loadout, { allowUndo: true }));
      }
      case 'selection': {
        const selectionType = data.selection;
        dispatch(setSearchQuery(''));
        dispatch(streamDeckWaitSelection(selectionType));

        // open the related page
        const path = selectionType === 'loadout' ? 'loadouts' : 'inventory';
        dispatch(setRouterLocation(routeTo(state, path)));

        // show the notification
        showSelectionNotification(state, selectionType, () => dispatch(streamDeckClearSelection()));
        return;
      }
      case 'loadout': {
        const loadouts = loadoutsSelector(state);
        const stores = storesSelector(state);
        const store = getStore(stores, data.character);
        const loadout = loadouts.find((it) => it.id === data.loadout);
        if (store && loadout) {
          return dispatch(applyLoadout(store, loadout, { allowUndo: true }));
        }
        return;
      }
      case 'shareLoadout': {
        const loadouts = loadoutsSelector(state);
        const account = currentAccountSelector(state);
        const accountId = account?.membershipId;
        const loadout = loadouts.find((it) => it.id === data.loadout);
        if (accountId && loadout) {
          const shareUrl =
            loadoutShares.get(loadout) ||
            (await createLoadoutShare(accountId, convertDimLoadoutToApiLoadout(loadout)));
          loadoutShares.set(loadout, shareUrl);
          return dispatch(
            sendToStreamDeck({
              shareUrl,
            })
          );
        }
        return;
      }
      case 'freeBucketSlot': {
        const items = currentStore.items.filter((it) => it.type === data.bucket);
        const vaultStore = vaultSelector(state);
        const pickedItem = items.find((it) => !it.equipped);
        pickedItem && (await dispatch(moveItemTo(pickedItem, vaultStore!, false)));
        return;
      }
      case 'pullItem': {
        const allItems = allItemsSelector(state);
        const vaultStore = vaultSelector(state);
        const item = allItems.find((it) => it.index === data.item);
        if (item) {
          if (currentStore.items.includes(item)) {
            await dispatch(moveItemTo(item, vaultStore!, false));
          } else {
            await dispatch(moveItemTo(item, currentStore, false));
          }
        }
      }
    }
  };
}

const installFarmingObserver = _.once((dispatch) => {
  observeStore(
    (state) => state.farming.storeId,
    (_, newState) => {
      dispatch(
        sendToStreamDeck({
          farmingMode: Boolean(newState),
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
          postmaster: packager.postmaster(store),
          maxPower: packager.maxPower(store, state),
          vault: packager.vault(state),
          metrics: packager.metrics(state),
        })
      );
    };
    clearInterval(refreshInterval);
    refreshInterval = window.setInterval(refreshAction, 30000);
    refreshAction();
  };
}

// Calc location path
function routeTo(state: RootState, path: string) {
  const account = currentAccountSelector(state);
  return account ? `${accountRoute(account)}/${path}` : undefined;
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
        dispatch(handleStreamDeckMessage(data));
      };

      streamDeckWebSocket.onerror = function () {
        streamDeckWebSocket.close();
      };
    };

    initWS();
  };
}

function resetIdentifierOnStreamDeck() {
  streamDeckWebSocket?.send(`dim://reset:${clientIdentifier()}`);
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
