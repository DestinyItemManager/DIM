// async module

// serialize the data and send it if connected
import { currentAccountSelector } from 'app/accounts/selectors';
import { startFarming, stopFarming } from 'app/farming/actions';
import { t } from 'app/i18next-t';
import { moveItemTo } from 'app/inventory/move-item';
import {
  allItemsSelector,
  currentStoreSelector,
  storesSelector,
  vaultSelector,
} from 'app/inventory/selectors';
import { getStore } from 'app/inventory/stores-helpers';
import { itemMoveLoadout, maxLightLoadout, randomLoadout } from 'app/loadout-drawer/auto-loadouts';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { pullFromPostmaster } from 'app/loadout-drawer/postmaster';
import { applyInGameLoadout } from 'app/loadout/ingame/ingame-loadout-apply';
import { allInGameLoadoutsSelector } from 'app/loadout/ingame/selectors';
import { loadoutsSelector } from 'app/loadout/loadouts-selector';
import { showNotification } from 'app/notifications/notifications';
import { accountRoute } from 'app/routes';
import { filterFactorySelector } from 'app/search/items/item-search-filter';
import { setRouterLocation, setSearchQuery } from 'app/shell/actions';
import { refresh } from 'app/shell/refresh-events';
import { RootState, ThunkResult } from 'app/store/types';
import {
  CollectPostmasterAction,
  EquipLoadoutAction,
  FarmingModeAction,
  HandlerArgs,
  MaxPowerAction,
  MessageHandler,
  PullItemAction,
  RandomizeAction,
  RequestPickerItemsAction,
  SearchAction,
  SelectionAction,
  StreamDeckMessage,
} from 'app/stream-deck/interfaces';
import { delay } from 'app/utils/promises';
import { DamageType } from 'bungie-api-ts/destiny2';
import { streamDeckSelection } from './actions';
import { sendToStreamDeck } from './async-module';
import packager, { streamDeckClearId } from './util/packager';

// Calc location path
function routeTo(state: RootState, path: string) {
  const account = currentAccountSelector(state);
  return account ? `${accountRoute(account)}/${path}` : undefined;
}

function refreshHandler(): ThunkResult {
  return async () => {
    refresh();
  };
}

function requestPickerItemsHandler({
  msg,
  state,
}: HandlerArgs<RequestPickerItemsAction>): ThunkResult {
  return async () => {
    const items = searchItems(state, msg.query);
    items.sort((a, b) => a.name.localeCompare(b.name));
    sendToStreamDeck({
      action: 'pickerItems',
      data: {
        device: msg.device,
        items: items.map((item) => ({
          label: item.name,
          item: streamDeckClearId(item.index),
          icon: item.icon,
          overlay: item.iconOverlay,
          isExotic: item.isExotic,
          isCrafted: Boolean(item.crafted),
          element:
            item.element?.enumValue === DamageType.Kinetic
              ? undefined
              : item.element?.displayProperties?.icon,
        })),
      },
    });
  };
}

function searchItems(state: RootState, query: string) {
  const allItems = allItemsSelector(state);
  const filter = filterFactorySelector(state)(query);
  return allItems.filter((i) => filter(i));
}

function searchHandler({ msg, state, store }: HandlerArgs<SearchAction>): ThunkResult {
  return async (dispatch, getState) => {
    const searchOnly = !msg.pullItems && !msg.sendToVault;

    if (searchOnly) {
      // change page if needed
      if (!window.location.pathname.endsWith(msg.page)) {
        dispatch(setRouterLocation(routeTo(state, msg.page || 'inventory')));
        // delay a bit to trigger the search
        await delay(250);
      }
      // update the search query
      dispatch(setSearchQuery(state.shell.searchQuery === msg.query ? '' : msg.query));
    } else if (msg.query) {
      // reset any previous search
      dispatch(setSearchQuery(''));
      // find items
      const searchedItems = searchItems(getState(), msg.query);
      // skip action if no items found
      if (searchedItems.length === 0) {
        return;
      }
      // move items to the vault or current store
      const targetStore = msg.sendToVault ? vaultSelector(state) : store;
      if (targetStore) {
        const loadout = itemMoveLoadout(searchedItems, targetStore);
        await dispatch(applyLoadout(targetStore, loadout, { allowUndo: true }));
      }
    }
  };
}

// TODO move to a shared module
function randomizeHandler({ msg, state, store }: HandlerArgs<RandomizeAction>): ThunkResult {
  return async (dispatch) => {
    const allItems = allItemsSelector(state);
    const loadout = randomLoadout(
      store,
      allItems,
      msg.weaponsOnly ? (i) => i.bucket?.sort === 'Weapons' : () => true,
    );
    loadout && (await dispatch(applyLoadout(store, loadout, { allowUndo: true })));
  };
}

function collectPostmasterHandler({ store }: HandlerArgs<CollectPostmasterAction>): ThunkResult {
  return async (dispatch) => dispatch(pullFromPostmaster(store));
}

// TODO move to a shared module
function maximizePowerHandler({ state, store }: HandlerArgs<MaxPowerAction>): ThunkResult {
  return async (dispatch) => {
    const allItems = allItemsSelector(state);
    const loadout = maxLightLoadout(allItems, store);
    return dispatch(applyLoadout(store, loadout, { allowUndo: true }));
  };
}

function farmingModeHandler({ state, store }: HandlerArgs<FarmingModeAction>): ThunkResult {
  return async (dispatch) => {
    if (state.farming.storeId) {
      return dispatch(stopFarming());
    } else {
      return dispatch(startFarming(store?.id));
    }
  };
}

function equipLoadoutHandler({ msg, state }: HandlerArgs<EquipLoadoutAction>): ThunkResult {
  return async (dispatch) => {
    const stores = storesSelector(state);
    const store = msg.character ? getStore(stores, msg.character) : currentStoreSelector(state);

    if (!store) {
      return;
    }

    // In Game Loadouts
    if (msg.loadout.startsWith('ingame')) {
      const loadouts = allInGameLoadoutsSelector(state);
      const loadout = loadouts.find((it) => it.id === msg.loadout);
      return loadout && dispatch(applyInGameLoadout(loadout));
    }

    // DIM Loadouts
    const loadouts = loadoutsSelector(state);
    const loadout = loadouts.find((it) => it.id === msg.loadout);
    return loadout && dispatch(applyLoadout(store, loadout, { allowUndo: true }));
  };
}

function pullItemHandler({ msg, state, store }: HandlerArgs<PullItemAction>): ThunkResult {
  return async (dispatch) => {
    const allItems = allItemsSelector(state);
    const [item] = allItems.filter((it) => it.index.startsWith(msg.itemId));
    const targetStore = msg.type === 'vault' ? vaultSelector(state) : store;
    const shouldEquip = msg.type === 'equip' || msg.equip;
    if (targetStore) {
      await dispatch(moveItemTo(item, targetStore, shouldEquip, item.amount));
    }
  };
}

function selectionHandler({ msg }: HandlerArgs<SelectionAction>): ThunkResult {
  return async (dispatch) => {
    dispatch(streamDeckSelection(msg.type));
  };
}

function requestPerksHandler(): ThunkResult {
  return async (_, getState) => {
    sendToStreamDeck({
      action: 'perks',
      data: packager.perks(getState()),
    });
  };
}

const handlers: MessageHandler = {
  refresh: refreshHandler,
  search: searchHandler,
  randomize: randomizeHandler,
  collectPostmaster: collectPostmasterHandler,
  equipMaxPower: maximizePowerHandler,
  toggleFarmingMode: farmingModeHandler,
  equipLoadout: equipLoadoutHandler,
  pullItem: pullItemHandler,
  requestPickerItems: requestPickerItemsHandler,
  selection: selectionHandler,
  requestPerks: requestPerksHandler,
};

// handle actions coming from the stream deck instance
export function handleStreamDeckMessage(msg: StreamDeckMessage, token: string): ThunkResult {
  return async (dispatch, getState) => {
    const state = getState();
    const store = currentStoreSelector(state);
    if (!msg.token || msg.token !== token) {
      showNotification({
        type: 'error',
        title: 'Stream Deck',
        body: t('StreamDeck.MissingAuthorization'),
      });
      throw new Error(!msg.token ? 'missing-token' : 'invalid-token');
    }
    if (store) {
      // handle stream deck actions
      const handler = handlers[msg.action] as (args: HandlerArgs<StreamDeckMessage>) => ThunkResult;
      dispatch(handler?.({ msg, state, store }));
    }
  };
}
