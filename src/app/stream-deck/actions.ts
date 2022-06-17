import { currentAccountSelector } from 'app/accounts/selectors';
import { createLoadoutShare } from 'app/dim-api/dim-api';
import { startFarming, stopFarming } from 'app/farming/actions';
import { t } from 'app/i18next-t';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import {
  allItemsSelector,
  currentStoreSelector,
  storesSelector,
  vaultSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { maxLightLoadout, randomLoadout } from 'app/loadout-drawer/auto-loadouts';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { convertDimLoadoutToApiLoadout } from 'app/loadout-drawer/loadout-type-converters';
import { Loadout, LoadoutItem } from 'app/loadout-drawer/loadout-types';
import { pullFromPostmaster } from 'app/loadout-drawer/postmaster';
import { loadoutsSelector } from 'app/loadout-drawer/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { setSearchQuery } from 'app/shell/actions';
import { refresh } from 'app/shell/refresh-events';
import { RootState, ThunkResult } from 'app/store/types';
import {
  streamDeckLoadoutsUpdate,
  streamDeckMaxPowerUpdate,
  streamDeckMetricsUpdate,
  streamDeckPostMasterUpdate,
  streamDeckVaultUpdate,
} from 'app/stream-deck/stream-deck-update';
import { observeStore } from 'app/utils/redux-utils';
import _ from 'lodash';
import { createAction } from 'typesafe-actions';

let streamDeckWebSocket: WebSocket;

let refreshInterval: ReturnType<typeof setInterval>;

// Cache shares to loadouts weakly, to cut down on creating shares
const loadoutShares = new WeakMap<Loadout, string>();

export const streamDeckConnected = createAction('stream-deck/CONNECTED')();

export const streamDeckDisconnected = createAction('stream-deck/DISCONNECTED')();

export const streamDeckChangeStatus = createAction('stream-deck/CHANGE-STATUS')<boolean>();

export const streamDeckWaitSelection = createAction('stream-deck/WAIT-SELECTION')<
  'loadout' | 'item'
>();

export const streamDeckClearSelection = createAction('stream-deck/CLEAR-SELECTION')();

interface StreamDeckMessage {
  action:
    | 'search'
    | 'randomize'
    | 'collectPostmaster'
    | 'refresh'
    | 'farmingMode'
    | 'maxPower'
    | 'freeSlot'
    | 'pullItem'
    | 'selection'
    | 'loadout'
    | 'shareLoadout';
  args: {
    search: string;
    weaponsOnly: boolean;
    loadout: string;
    character: string;
    slot: InventoryBucket['type'];
    item: string;
    page: string;
    selection: 'loadout' | 'item';
  };
}

// serialize the data and send it if connected
export function sendToStreamDeck(args: Record<string, any>): ThunkResult {
  return async () => {
    if (streamDeckWebSocket?.readyState === WebSocket.OPEN) {
      streamDeckWebSocket.send(JSON.stringify(args));
    }
  };
}

// on click on InventoryItem send the selected item to the Stream Deck
export function streamDeckSelectItem(item: DimItem): ThunkResult {
  return async (dispatch, getState) => {
    const { streamDeck } = getState();
    if (streamDeck.enabled && streamDeck.selection === 'item') {
      hideItemPopup();
      streamDeck.selectionPromise.resolve();
      dispatch(streamDeckClearSelection());
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
    if (def?.inventory?.bucketTypeHash === 3284755031) {
      return def.displayProperties.icon;
    }
  }
}

// on click on LoadoutView send the selected loadout and the related character identifier to the Stream Deck
export function streamDeckSelectLoadout(loadout: Loadout, store: DimStore): ThunkResult {
  return async (dispatch, getState) => {
    const state = getState();
    if (state.streamDeck.enabled && state.streamDeck.selection === 'loadout') {
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

export function sendLoadouts(): ThunkResult {
  return async (dispatch, getState) => {
    const loadouts = streamDeckLoadoutsUpdate(getState());
    if (Object.keys(loadouts).length) {
      return dispatch(sendToStreamDeck({ loadouts }));
    }
  };
}

// Show notification asking for selection
function showSelectionNotification(state: RootState, selectionType: string, onCancel?: () => void) {
  showNotification({
    title: 'Elgato Stream Deck',
    body: t(`StreamDeck.SelectionNotification.${_.startCase(selectionType)}`),
    type: 'info',
    duration: 500,
    onCancel,
    promise: state.streamDeck.selectionPromise.promise,
  });
}

// click on the nav link to open a specific page
function goToPage(path: string) {
  const [menuItem] = document.querySelectorAll(`a[href$="/${path}"]`);
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  menuItem?.dispatchEvent(event);
}

// handle actions coming from the stream deck instance
export function handleStreamDeckMessage(data: StreamDeckMessage): ThunkResult {
  return async (dispatch, getState) => {
    const state = getState();
    const currentStore = currentStoreSelector(state);

    if (!currentStore) {
      return;
    }

    switch (data.action) {
      case 'refresh':
        return refresh();
      case 'search': {
        goToPage(data.args.page || 'inventory');
        setTimeout(() => dispatch(setSearchQuery(data.args.search, true)), 500);
        return;
      }
      case 'randomize': {
        const allItems = allItemsSelector(state);
        const loadout = randomLoadout(
          currentStore,
          allItems,
          data.args.weaponsOnly ? (i) => i.bucket?.sort === 'Weapons' : () => true
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
        const selectionType = data.args.selection;
        dispatch(setSearchQuery(''));
        dispatch(streamDeckWaitSelection(selectionType));

        // open the related page
        goToPage(selectionType === 'loadout' ? 'loadouts' : 'inventory');

        // show the notification
        setTimeout(
          () =>
            showSelectionNotification(state, selectionType, () => {
              dispatch(streamDeckClearSelection());
            }),
          500
        );
        return;
      }
      case 'loadout': {
        const loadouts = loadoutsSelector(state);
        const store = storesSelector(state).find((it) => it.id === data.args.character);
        const loadout = loadouts.find((it) => it.id === data.args.loadout);
        if (store && loadout) {
          return dispatch(applyLoadout(store, loadout, { allowUndo: true }));
        }
        return;
      }
      case 'shareLoadout': {
        const loadouts = loadoutsSelector(state);
        const account = currentAccountSelector(state);
        const accountId = account?.membershipId;
        const loadout = loadouts.find((it) => it.id === data.args.loadout);
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
      case 'freeSlot': {
        const items = currentStore.items.filter((it) => it.type === data.args.slot);
        const vaultStore = vaultSelector(state);
        const pickedItem = items.find((it) => !it.equipped);
        pickedItem && (await dispatch(moveItemTo(pickedItem, vaultStore!, false)));
        return;
      }
      case 'pullItem': {
        const allItems = allItemsSelector(state);
        const vaultStore = vaultSelector(state);
        const item = allItems.find((it) => it.id === data.args.item);
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

export const installFarmingObserver = _.once((dispatch) => {
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

export const installLoadoutsObserver = _.once((dispatch) => {
  observeStore(
    (state) => loadoutsSelector(state),
    () => dispatch(sendLoadouts())
  );
});

// collect and send to the stream deck specific refresh data
function refreshStreamDeck(): ThunkResult {
  return async (dispatch, getState) => {
    const listener = () => {
      const state = getState();
      const store = currentStoreSelector(getState());
      if (!store) {
        return;
      }
      dispatch(
        sendToStreamDeck({
          postmaster: streamDeckPostMasterUpdate(store),
          maxPower: streamDeckMaxPowerUpdate(store, state),
          vault: streamDeckVaultUpdate(state),
          metrics: streamDeckMetricsUpdate(state),
        })
      );
    };
    clearInterval(refreshInterval);
    refreshInterval = setInterval(listener, 30000);
    listener();
  };
}

// stop the websocket's connection with the local stream deck instance
export function stopStreamDeckConnection(): ThunkResult {
  return async (dispatch) => {
    streamDeckWebSocket?.close();
    clearInterval(refreshInterval);
    dispatch(streamDeckDisconnected());
  };
}

// start the websocket's connection with the local stream deck instance
export function startStreamDeckConnection(): ThunkResult {
  return async (dispatch, getState) => {
    const initWS = () => {
      const state = getState();

      // if settings/manifest/profile are not loaded retry after 1s
      if (
        !state.dimApi.globalSettingsLoaded ||
        !state.manifest.destiny2CoreSettings ||
        !state.inventory.profileResponse?.profileProgression
      ) {
        setTimeout(initWS, 1000);
        return;
      }

      // if stream deck is disabled stop and don't try to connect
      if (!state.streamDeck.enabled) {
        return;
      }

      installFarmingObserver(dispatch);
      installLoadoutsObserver(dispatch);

      // close the existing websocket if connected
      if (streamDeckWebSocket && streamDeckWebSocket.readyState !== WebSocket.CLOSED) {
        streamDeckWebSocket.close();
      }

      // try to connect to the stream deck local instance
      streamDeckWebSocket = new WebSocket('ws://localhost:9119');

      streamDeckWebSocket.onopen = function () {
        dispatch(streamDeckConnected());
        dispatch(refreshStreamDeck());
        dispatch(sendLoadouts());
      };

      streamDeckWebSocket.onclose = function () {
        dispatch(streamDeckDisconnected());
        clearInterval(refreshInterval);
        if (getState().streamDeck.enabled) {
          // retry to re-connect after 5s
          setTimeout(initWS, 5000);
        }
      };

      streamDeckWebSocket.onmessage = function (e) {
        dispatch(handleStreamDeckMessage(JSON.parse(e.data)));
      };

      streamDeckWebSocket.onerror = function () {
        streamDeckWebSocket.close();
      };
    };

    initWS();
  };
}
