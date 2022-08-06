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
import { loadoutsSelector } from 'app/loadout-drawer/selectors';
import { showNotification } from 'app/notifications/notifications';
import { accountRoute } from 'app/routes';
import { filteredItemsSelector } from 'app/search/search-filter';
import { setRouterLocation, setSearchQuery } from 'app/shell/actions';
import { refresh } from 'app/shell/refresh-events';
import { RootState, ThunkResult } from 'app/store/types';
import { streamDeckClearSelection, streamDeckWaitSelection } from 'app/stream-deck/actions';
import { refreshStreamDeck, sendToStreamDeck } from 'app/stream-deck/async-module';
import { showStreamDeckAuthorizationNotification } from 'app/stream-deck/AuthorizationNotification/AuthorizationNotification';
import {
  AuthorizationConfirmAction,
  Challenge,
  CollectPostmasterAction,
  EquipLoadoutAction,
  FarmingModeAction,
  HandlerArgs,
  MaxPowerAction,
  MessageHandler,
  PullItemAction,
  PullItemsInfoAction,
  RandomizeAction,
  SearchAction,
  SelectionAction,
  StreamDeckMessage,
} from 'app/stream-deck/interfaces';
import { DeferredPromise } from 'app/stream-deck/util/deferred';
import { setStreamDeckToken, streamDeckToken } from 'app/stream-deck/util/local-storage';
import { infoLog } from 'app/utils/log';
import { DamageType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';

// Deferred promise used with selections notifications and actions
export const notificationPromise = new DeferredPromise();

let onGoingAuthorizationChallenge: Challenge | undefined;

// Calc location path
function routeTo(state: RootState, path: string) {
  const account = currentAccountSelector(state);
  return account ? `${accountRoute(account)}/${path}` : undefined;
}

// Show notification asking for selection
function showSelectionNotification(selectionType: 'item' | 'loadout', onCancel?: () => void) {
  // cancel previous selection notification
  notificationPromise.resolve();
  showNotification({
    title: 'Elgato Stream Deck',
    body:
      selectionType === 'item' ? t('StreamDeck.Selection.Item') : t('StreamDeck.Selection.Loadout'),
    type: 'info',
    duration: 500,
    onCancel,
    onClick: onCancel,
    promise: notificationPromise.promise,
  });
}

function refreshHandler(): ThunkResult {
  return async () => {
    refresh();
  };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function searchHandler({ msg, state, store }: HandlerArgs<SearchAction>): ThunkResult {
  return async (dispatch, getState) => {
    if (!window.location.pathname.endsWith(msg.page)) {
      dispatch(setRouterLocation(routeTo(state, msg.page || 'inventory')));
      // delay a bit to trigger the search
      await delay(250);
    }
    dispatch(setSearchQuery(msg.search));
    // if pull items flag is enabled delay a bit to trigger the action
    if (msg.pullItems) {
      await delay(500);
      // use getState to obtain the updated state after search
      const loadout = itemMoveLoadout(filteredItemsSelector(getState()), store);
      await dispatch(applyLoadout(store, loadout, { allowUndo: true }));
      dispatch(setSearchQuery('', true));
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
      msg.weaponsOnly ? (i) => i.bucket?.sort === 'Weapons' : () => true
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

function selectionHandler({ msg, state }: HandlerArgs<SelectionAction>): ThunkResult {
  return async (dispatch) => {
    const selectionType = msg.selection;
    dispatch(setSearchQuery(''));
    dispatch(streamDeckWaitSelection(selectionType));
    // open the related page
    const path = selectionType === 'loadout' ? 'loadouts' : 'inventory';
    if (!window.location.pathname.endsWith(path)) {
      dispatch(setRouterLocation(routeTo(state, path)));
      // delay a bit the notification show
      await delay(100);
    }
    // show the notification
    showSelectionNotification(selectionType, () => dispatch(streamDeckClearSelection()));
  };
}

function itemsInfoRequestHandler({ msg, state }: HandlerArgs<PullItemsInfoAction>): ThunkResult {
  return async (dispatch) => {
    const items = allItemsSelector(state).filter((it) => msg.ids?.includes(it.index));
    return dispatch(
      sendToStreamDeck({
        action: 'items:info',
        data: {
          info: items.map((it) => ({
            identifier: it.index,
            power: it.power,
            overlay: it.iconOverlay,
            isExotic: it.isExotic,
            element:
              it.element?.enumValue === DamageType.Kinetic
                ? undefined
                : it.element?.displayProperties?.icon,
          })),
        },
      })
    );
  };
}

function equipLoadoutHandler({ msg, state }: HandlerArgs<EquipLoadoutAction>): ThunkResult {
  return async (dispatch) => {
    const loadouts = loadoutsSelector(state);
    const stores = storesSelector(state);
    const store = getStore(stores, msg.character);
    const loadout = loadouts.find((it) => it.id === msg.loadout);
    if (store && loadout) {
      return dispatch(applyLoadout(store, loadout, { allowUndo: true }));
    }
  };
}

/*

Feature toggled out (to be discussed as possible new feature on DIM)

function freeBucketSlotHandler({
  msg,
  state,
  store,
}: HandlerArgs<FreeBucketSlotAction>): ThunkResult {
  return async (dispatch) => {
    const items = store.items.filter((it) => it.type === msg.bucket);
    const vaultStore = vaultSelector(state);
    const pickedItem = items.find((it) => !it.equipped);
    pickedItem && (await dispatch(moveItemTo(pickedItem, vaultStore!, false)));
  };
}
*/
function pullItemHandler({ msg, state, store }: HandlerArgs<PullItemAction>): ThunkResult {
  return async (dispatch) => {
    const allItems = allItemsSelector(state);
    const vaultStore = vaultSelector(state);
    const selected = allItems.filter((it) => it.index.startsWith(msg.item));
    const moveToVaultItem = selected.find((it) => it.owner !== 'vault');
    if (!selected.length) {
      // no matching item found
      return;
    }
    // move to vault only if the action is not a long press (EQUIP action)
    // this will equip item even if it is already in the character inventory
    if (!msg.equip && moveToVaultItem) {
      await dispatch(moveItemTo(moveToVaultItem, vaultStore!, false, moveToVaultItem.amount));
    } else {
      const item = selected[0];
      await dispatch(moveItemTo(item, store, msg.equip, item.amount));
    }
  };
}

function authorizationConfirmHandler(args: HandlerArgs<AuthorizationConfirmAction>): ThunkResult {
  const { msg } = args;
  return async (dispatch) => {
    const { label, value } = onGoingAuthorizationChallenge || {};
    // handle confirmation
    if (label && label === msg.challenge) {
      // if label exist then also the values is defined
      setStreamDeckToken(value!);
      // hide the notification
      notificationPromise.resolve();
      // refresh stream deck state
      await dispatch(refreshStreamDeck());
      // the current challenge is no more valid
      onGoingAuthorizationChallenge = undefined;
      return;
    }
    // if the user tapped the error challenge number
    // hide the notification
    notificationPromise.reject('invalid-challenge');
    // trigger the challenges again
    return dispatch(authorizationInitHandler());
  };
}

// generate 3 challenges for the authorization flow
function generateChallenges() {
  const added = new Set();
  const challenges = [];
  while (challenges.length < 3) {
    const label = _.random(100, 999, false);
    if (!added.has(label)) {
      added.add(label);
      challenges.push({
        label,
        value: _.random(true).toString(36).slice(2),
      });
    }
  }
  return challenges;
}

function authorizationInitHandler(): ThunkResult {
  return async (dispatch) => {
    const challenges = generateChallenges();
    const challenge = challenges[_.random(2, false)];
    // keep track of current challenge
    onGoingAuthorizationChallenge = challenge;
    // hide previous notification
    notificationPromise.resolve();
    // show challenge number
    showStreamDeckAuthorizationNotification(challenge.label);
    return dispatch(
      sendToStreamDeck(
        {
          action: 'authorization:challenges',
          data: { challenges },
        },
        true
      )
    );
  };
}

const handlers: MessageHandler = {
  refresh: refreshHandler,
  search: searchHandler,
  randomize: randomizeHandler,
  collectPostmaster: collectPostmasterHandler,
  maxPower: maximizePowerHandler,
  farmingMode: farmingModeHandler,
  selection: selectionHandler,
  loadout: equipLoadoutHandler,
  // freeBucketSlot: freeBucketSlotHandler,
  pullItem: pullItemHandler,
  'pullItem:items-request': itemsInfoRequestHandler,
  'authorization:init': authorizationInitHandler,
  'authorization:confirm': authorizationConfirmHandler,
};

// handle actions coming from the stream deck instance
export function handleStreamDeckMessage(msg: StreamDeckMessage): ThunkResult {
  return async (dispatch, getState) => {
    const state = getState();
    const store = currentStoreSelector(state);
    const token = streamDeckToken();
    if (!msg.action.startsWith('authorization')) {
      if (!msg.token) {
        throw new Error('missing-token');
      } else if (token && msg.token !== token) {
        throw new Error('invalid-token');
      }
    }

    if (store) {
      // handle stream deck actions
      const handler = handlers[msg.action];
      dispatch(handler?.({ msg, state, store }));
    }
  };
}

infoLog('sd', 'loaded');
