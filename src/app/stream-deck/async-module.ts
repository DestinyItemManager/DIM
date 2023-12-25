// async module

// serialize the data and send it if connected
import { currentStoreSelector } from 'app/inventory/selectors';
import { refresh$ } from 'app/shell/refresh-events';
import store from 'app/store/store';
import { ThunkResult } from 'app/store/types';
import { streamDeckConnected, streamDeckDisconnected } from 'app/stream-deck/actions';
import { SendToStreamDeckArgs, StreamDeckMessage } from 'app/stream-deck/interfaces';
import { handleStreamDeckMessage } from 'app/stream-deck/msg-handlers';
import { streamDeckAuth, streamDeckEnabled } from 'app/stream-deck/util/local-storage';
import packager from 'app/stream-deck/util/packager';
import { infoLog } from 'app/utils/log';
import { observeStore } from 'app/utils/redux';
// import { DamageType, DestinyClass, DestinyLoadoutItemComponent } from 'bungie-api-ts/destiny2';
// import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';

let streamDeckWebSocket: WebSocket;

let refreshInterval: number;

export async function sendToStreamDeck(msg: SendToStreamDeckArgs) {
  if (streamDeckWebSocket?.readyState === WebSocket.OPEN) {
    streamDeckWebSocket.send(
      JSON.stringify({
        ...msg,
      }),
    );
  }
}

// // on click on InventoryItem send the selected item to the Stream Deck
// function streamDeckSelectItem(item: DimItem): ThunkResult {
//   return async (dispatch, getState) => {
//     const { streamDeck } = getState();
//     if (streamDeck.selection === 'item' && !item.notransfer) {
//       // hide the item popup that will be opened on classic item click
//       hideItemPopup();
//       // hide the notification
//       notificationPromise.resolve();
//       // clear the selection state in the store
//       dispatch(streamDeckClearSelection());
//       // send selection to the Stream Deck
//       return sendToStreamDeck({
//         action: 'dim:selection',
//         data: {
//           selectionType: 'item',
//           selection: {
//             label: item.name,
//             subtitle: item.typeName,
//             item: item.index.replace(/-.*/, ''),
//             icon: item.icon,
//             overlay: item.iconOverlay,
//             isExotic: item.isExotic,
//             inventory: item.location.accountWide,
//             element:
//               item.element?.enumValue === DamageType.Kinetic
//                 ? undefined
//                 : item.element?.displayProperties?.icon,
//           },
//         },
//       });
//     }
//   };
// }

// function findSubClass(items: LoadoutItem[], state: RootState) {
//   const defs = d2ManifestSelector(state);
//   for (const item of items) {
//     const def = defs?.InventoryItem.get(item.hash);
//     // find subclass item
//     if (def?.inventory?.bucketTypeHash === BucketHashes.Subclass) {
//       return def.displayProperties.icon;
//     }
//   }
// }

// function findSubClassInGame(items: DestinyLoadoutItemComponent[], state: RootState) {
//   const allItems = allItemsSelector(state);
//   const itemCreationContext = createItemContextSelector(state);
//   const mappedItems = getItemsFromInGameLoadout(itemCreationContext, items, allItems);
//   const categories = Map.groupBy(mappedItems, (li) => li.item.bucket.sort);
//   const subclassItem = categories.get('General')?.[0];
//   return subclassItem?.item.icon;
// }

// // on click on LoadoutView send the selected loadout and the related character identifier to the Stream Deck
// function streamDeckSelectLoadout(
//   { type, loadout }: LoadoutSelection,
//   store: DimStore,
// ): ThunkResult {
//   return async (dispatch, getState) => {
//     let selection: NonNullable<SelectionArgs['data']>['selection'];
//     const state = getState();
//     if (state.streamDeck.selection === 'loadout') {
//       notificationPromise.resolve();
//       dispatch(streamDeckClearSelection());
//       switch (type) {
//         case 'game':
//           selection = {
//             label: loadout.name.toUpperCase(),
//             loadout: loadout.id,
//             subtitle: '-',
//             character: loadout.characterId,
//             // future stream deck plugin update
//             background: loadout.colorIcon,
//             gameIcon: loadout.icon,
//             // current plugin version
//             icon: findSubClassInGame(loadout.items, state) ?? loadout.icon,
//           };
//           break;
//         default: {
//           const isAnyClass = loadout.classType === DestinyClass.Unknown;
//           selection = {
//             label: loadout.name.toUpperCase(),
//             loadout: loadout.id,
//             subtitle: (isAnyClass ? '' : store.className) || loadout.notes || '-',
//             character: isAnyClass ? undefined : store.id,
//             icon: findSubClass(loadout.items, state),
//           };
//         }
//       }
//       return sendToStreamDeck({
//         action: 'dim:selection',
//         data: {
//           selectionType: 'loadout',
//           selection,
//         },
//       });
//     }
//   };
// }

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
  return async (_dispatch, getState) => {
    const refreshAction = () => {
      const state = getState();
      const store = currentStoreSelector(getState());
      if (!store) {
        return;
      }
      sendToStreamDeck({
        action: 'state',
        data: {
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
function stopStreamDeckConnection(): ThunkResult {
  return async (dispatch) => {
    streamDeckWebSocket?.close();
    clearInterval(refreshInterval);
    dispatch(streamDeckDisconnected());
  };
}

// refresh the stream deck state on refresh events
const installRefresObserver = _.once(() => {
  refresh$.subscribe(() => refreshStreamDeck());
});

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

      // if stream deck is disabled stop and don't try to connect
      if (!streamDeckEnabled()) {
        return;
      }

      const auth = streamDeckAuth();

      // if the plugin is enabled but the auth is not set stop
      if (!auth) {
        return;
      }

      // install refresh observer
      installRefresObserver();

      // close the existing websocket if connected
      if (streamDeckWebSocket && streamDeckWebSocket.readyState !== WebSocket.CLOSED) {
        streamDeckWebSocket.close();
      }

      // try to connect to the stream deck local instance
      streamDeckWebSocket = new WebSocket(`ws://localhost:9120/${auth.instance}`);

      streamDeckWebSocket.onopen = function () {
        // update the connection status
        dispatch(streamDeckConnected());
        // start refreshing task with interval
        dispatch(refreshStreamDeck());
        // install farming mode observer
        installFarmingObserver();
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
        dispatch(
          handleStreamDeckMessage(JSON.parse(data as string) as StreamDeckMessage, auth.token),
        );
      };

      streamDeckWebSocket.onerror = function () {
        streamDeckWebSocket.close();
      };
    };

    initWS();
  };
}

infoLog('stream deck', 'feature lazy loaded');

// async module loaded in ./stream-deck.ts using lazy import
export default {
  startStreamDeckConnection,
  stopStreamDeckConnection,
};
