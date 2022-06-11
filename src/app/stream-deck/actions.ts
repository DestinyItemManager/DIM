import { settingSelector } from 'app/dim-api/selectors';
import { startFarming, stopFarming } from 'app/farming/actions';
import { allItemsSelector, currentStoreSelector, storesSelector } from 'app/inventory/selectors';
import { maxLightLoadout, randomLoadout } from 'app/loadout-drawer/auto-loadouts';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { pullFromPostmaster } from 'app/loadout-drawer/postmaster';
import { loadoutsSelector } from 'app/loadout-drawer/selectors';
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

interface StreamDeckMessage {
  action:
    | 'search'
    | 'randomize'
    | 'collectPostmaster'
    | 'refresh'
    | 'farmingMode'
    | 'maxPower'
    | 'loadout';
  args: {
    search: string;
    weaponsOnly: boolean;
    loadout: string;
    character: string;
  };
}

// serialize the data and send it if connected
export function sendToStreamDeck(args: Record<string, any>): ThunkResult {
  return async (_, getState) => {
    if (!getState().streamDeck.connected) {
      return;
    }
    streamDeckWebSocket.send(JSON.stringify(args));
  };
}

export function sendLoadouts(): ThunkResult {
  return async (dispatch, getState) => {
    const loadouts = streamDeckLoadoutsUpdate(getState());
    if (Object.keys(loadouts).length) {
      return dispatch(
        sendToStreamDeck({
          loadouts,
        })
      );
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
      case 'loadout': {
        const loadouts = loadoutsSelector(state);
        const store = storesSelector(state).find((it) => it.id === data.args.character);
        const loadout = loadouts.find((it) => it.id === data.args.loadout);
        if (store && loadout) {
          return dispatch(applyLoadout(store, loadout, { allowUndo: true }));
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

      // if stream deck is disabled stop don't try to connect
      if (!settingSelector('streamDeckEnabled')(state)) {
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
        const enabled = settingSelector('streamDeckEnabled')(getState());
        // retry to re-connect after 5s
        if (enabled) {
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
