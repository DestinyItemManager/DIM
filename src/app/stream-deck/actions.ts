import { startFarming, stopFarming } from 'app/farming/actions';
import { allItemsSelector, currentStoreSelector, storesSelector } from 'app/inventory/selectors';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { maxLightLoadout, randomLoadout } from 'app/loadout-drawer/auto-loadouts';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { pullFromPostmaster } from 'app/loadout-drawer/postmaster';
import { loadoutsSelector } from 'app/loadout-drawer/selectors';
import { showNotification } from 'app/notifications/notifications';
import { setSearchQuery } from 'app/shell/actions';
import { refresh } from 'app/shell/refresh-events';
import { ThunkResult } from 'app/store/types';
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
    | 'equipItem'
    | 'selection'
    | 'loadout';
  args: {
    search: string;
    weaponsOnly: boolean;
    loadout: string;
    character: string;
    slot: string;
    item: string;
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

export function streamDeckSelectItem(item: string, icon: string): ThunkResult {
  return async (dispatch, getState) => {
    const { streamDeck } = getState();
    if (streamDeck.enabled && streamDeck.selection === 'item') {
      hideItemPopup();
      dispatch(streamDeckClearSelection());
      return dispatch(sendToStreamDeck({ selection: { item, icon } }));
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
        dispatch(setSearchQuery(data.args.search, true));
        return;
      }
      case 'randomize': {
        const allItems = allItemsSelector(state);
        const loadout = randomLoadout(
          currentStore,
          allItems,
          data.args.weaponsOnly ? (i) => i.bucket?.sort === 'Weapons' : () => true
        );
        if (loadout) {
          await dispatch(applyLoadout(currentStore, loadout, { allowUndo: true }));
        }
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
        dispatch(setSearchQuery(''));
        dispatch(streamDeckWaitSelection(data.args.selection));
        showNotification({
          title: 'Stream Deck // Equip Item',
          body: 'Choose an item from the inventory',
          type: 'info',
          duration: 1000,
          promise: new Promise((resolve) => {
            const interval = setInterval(() => {
              const state = getState();
              if (!state.streamDeck.selection) {
                clearInterval(interval);
                resolve(true);
              }
            }, 1000);
          }),
        });
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
      case 'freeSlot': {
        throw new Error('Not implemented yet: "freeSlot" case');
      }
      case 'equipItem': {
        throw new Error('Not implemented yet: "equipItem" case');
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

      // if stream deck is disabled stop don't try to connect
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
