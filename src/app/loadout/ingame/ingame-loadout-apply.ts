import { currentAccountSelector } from 'app/accounts/selectors';
import {
  clearInGameLoadout,
  editInGameLoadout as editInGameLoadoutApi,
  equipInGameLoadout,
  snapshotInGameLoadout as snapshotInGameLoadoutApi,
} from 'app/bungie-api/destiny2-api';
import { t } from 'app/i18next-t';
import { inGameLoadoutNotification } from 'app/inventory/MoveNotifications';
import { itemMoved } from 'app/inventory/actions';
import { updateCharacters } from 'app/inventory/d2-stores';
import {
  allItemsSelector,
  createItemContextSelector,
  storesSelector,
} from 'app/inventory/selectors';
import { getStore } from 'app/inventory/stores-helpers';
import { itemMoveLoadout } from 'app/loadout-drawer/auto-loadouts';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { inGameLoadoutItemsFromEquipped } from 'app/loadout-drawer/loadout-utils';
import { showNotification } from 'app/notifications/notifications';
import { loadingTracker } from 'app/shell/loading-tracker';
import { ThunkResult } from 'app/store/types';
import { queueAction } from 'app/utils/action-queue';
import { DimError } from 'app/utils/dim-error';
import { reportException } from 'app/utils/exceptions';
import { errorLog } from 'app/utils/log';
import { PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import { useSelector } from 'react-redux';
import { inGameLoadoutDeleted, inGameLoadoutUpdated } from './actions';
import { getItemsFromInGameLoadout } from './ingame-loadout-utils';

/**
 * Ask the API to equip an ingame loadout.
 */
export function applyInGameLoadout(loadout: InGameLoadout): ThunkResult {
  return async (dispatch, getState) => {
    const itemCreationContext = useSelector(createItemContextSelector);
    const account = currentAccountSelector(getState())!;
    const stores = storesSelector(getState());
    const target = getStore(stores, loadout.characterId)!;
    try {
      const applyPromise = queueAction(() =>
        loadingTracker.addPromise(equipInGameLoadout(account, loadout))
      );
      showNotification(inGameLoadoutNotification(loadout, applyPromise));

      await applyPromise;

      // Find each item, and update it to be equipped!
      const items = getItemsFromInGameLoadout(
        itemCreationContext,
        loadout.items,
        allItemsSelector(getState())
      ).map((li) => li.item);

      for (const item of items) {
        // Update items to be equipped
        // TODO: we don't get updated mod states :-( https://github.com/Bungie-net/api/issues/1792
        const source = getStore(stores, item.owner)!;
        dispatch(itemMoved({ item, source, target, equip: true, amount: 1 }));

        // TODO: update the item model to have the right mods plugged. Hard to do
        // this without knowing more about the loadouts structure.
      }

      // TODO: only reload the character that changed
      // Refresh light levels and such
      dispatch(updateCharacters());
    } catch (e) {
      errorLog('inGameLoadout', 'error equipping loadout', loadout.name, 'to', target.name, e);
      // Some errors aren't worth reporting
      if (
        e instanceof DimError &&
        (e.bungieErrorCode() === PlatformErrorCodes.DestinyCannotPerformActionAtThisLocation ||
          e.bungieErrorCode() === PlatformErrorCodes.DestinyNoRoomInDestination)
      ) {
        // don't report
      } else {
        reportException('inGameLoadout', e);
      }
    }
  };
}

/**
 * move a loadout's items to their character. maybe applyInGameLoadout should incorporate this behavior
 */
export function prepInGameLoadout(loadout: InGameLoadout): ThunkResult {
  return async (dispatch, getState) => {
    const stores = storesSelector(getState());
    const targetStore = getStore(stores, loadout.characterId)!;
    const allItems = allItemsSelector(getState());
    const itemCreationContext = createItemContextSelector(getState());
    const loadoutItems = getItemsFromInGameLoadout(
      itemCreationContext,
      loadout.items,
      allItems
    ).map((li) => li.item);

    const moveLoadout = itemMoveLoadout(loadoutItems, targetStore);
    dispatch(applyLoadout(targetStore, moveLoadout));
  };
}

export function deleteInGameLoadout(loadout: InGameLoadout): ThunkResult {
  return async (dispatch, getState) => {
    const account = currentAccountSelector(getState())!;
    try {
      await clearInGameLoadout(account, loadout);

      showNotification({
        title: t('InGameLoadout.Deleted'),
        body: t('InGameLoadout.DeletedBody', { index: loadout.index + 1 }),
      });

      dispatch(inGameLoadoutDeleted(loadout));
    } catch (e) {
      showNotification({
        type: 'error',
        title: t('InGameLoadout.DeleteFailed'),
        body: e.message,
      });
    }
  };
}

export function editInGameLoadout(loadout: InGameLoadout): ThunkResult {
  return async (dispatch, getState) => {
    const account = currentAccountSelector(getState())!;
    try {
      await editInGameLoadoutApi(account, loadout);
      dispatch(inGameLoadoutUpdated(loadout));
    } catch (e) {
      showNotification({
        type: 'error',
        title: t('InGameLoadout.EditFailed'),
        body: e.message,
      });
    }
  };
}

export function snapshotInGameLoadout(loadout: InGameLoadout): ThunkResult {
  return async (dispatch, getState) => {
    const account = currentAccountSelector(getState())!;
    const store = getStore(storesSelector(getState()), loadout.characterId)!;
    loadout = { ...loadout, items: inGameLoadoutItemsFromEquipped(store) };
    try {
      await snapshotInGameLoadoutApi(account, loadout);
      dispatch(inGameLoadoutUpdated(loadout));
    } catch (e) {
      showNotification({
        type: 'error',
        title: t('InGameLoadout.SnapshotFailed'),
        body: e.message,
      });
    }
  };
}
