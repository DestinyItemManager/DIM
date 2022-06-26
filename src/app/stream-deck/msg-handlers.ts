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
import { sendToStreamDeck } from 'app/stream-deck/async-module';
import { showStreamDeckAuthorizationNotification } from 'app/stream-deck/AuthorizationNotification/AuthorizationNotification';
import {
  AuthorizationConfirmAction,
  AuthorizationInitAction,
  Challenge,
  CollectPostmasterAction,
  EquipLoadoutAction,
  FarmingModeAction,
  FreeBucketSlotAction,
  HandlerArgs,
  MaxPowerAction,
  MessageHandler,
  PullItemAction,
  RandomizeAction,
  SearchAction,
  SelectionAction,
  StreamDeckMessage,
} from 'app/stream-deck/interfaces';
import { setStreamDeckToken, streamDeckToken } from 'app/stream-deck/util/local-storage';
import _ from 'lodash';

let onGoingAuthorizationChallenge: Challenge | undefined;

// Calc location path
function routeTo(state: RootState, path: string) {
  const account = currentAccountSelector(state);
  return account ? `${accountRoute(account)}/${path}` : undefined;
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
    showSelectionNotification(state, selectionType, () => dispatch(streamDeckClearSelection()));
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

function pullItemHandler({ msg, state, store }: HandlerArgs<PullItemAction>): ThunkResult {
  return async (dispatch) => {
    const allItems = allItemsSelector(state);
    const vaultStore = vaultSelector(state);
    const item = allItems.find((it) => it.index === msg.item);
    if (item) {
      if (store.items.includes(item)) {
        await dispatch(moveItemTo(item, vaultStore!, false));
      } else {
        await dispatch(moveItemTo(item, store, false));
      }
    }
  };
}

function authorizationConfirmHandler({
  msg,
  state,
}: HandlerArgs<AuthorizationConfirmAction>): ThunkResult {
  return async () => {
    const { label, value } = onGoingAuthorizationChallenge || {};
    if (label && label === msg.challenge) {
      // if label exist then also the values is defined
      setStreamDeckToken(value!);
      // hide the notification
      state.streamDeck.selectionPromise.resolve();
    }
    // the current challenge is no more valid
    onGoingAuthorizationChallenge = undefined;
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

function authorizationInitHandler({ state }: HandlerArgs<AuthorizationInitAction>): ThunkResult {
  return async (dispatch) => {
    const challenges = generateChallenges();
    const challenge = challenges[_.random(2, false)];
    // keep track of current challenge
    onGoingAuthorizationChallenge = challenge;
    // hide previous notification
    state.streamDeck.selectionPromise.resolve();
    // show challenge number
    showStreamDeckAuthorizationNotification(challenge.label, state.streamDeck.selectionPromise);
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
  freeBucketSlot: freeBucketSlotHandler,
  pullItem: pullItemHandler,
  'authorization:init': authorizationInitHandler,
  'authorization:confirm': authorizationConfirmHandler,
};

// handle actions coming from the stream deck instance
export function handleStreamDeckMessage(msg: StreamDeckMessage): ThunkResult {
  return async (dispatch, getState) => {
    const state = getState();
    const store = currentStoreSelector(state);

    if (!msg.token && !msg.action.startsWith('authorization')) {
      throw new Error('missing-token');
    }

    if (msg.token && msg.token !== streamDeckToken()) {
      throw new Error('invalid-token');
    }

    if (store) {
      // handle stream deck actions
      const handler = handlers[msg.action];
      dispatch(handler?.({ msg, state, store }));
    }
  };
}
