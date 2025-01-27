import { currentAccountSelector } from 'app/accounts/selectors';
import {
  clearInGameLoadout,
  editInGameLoadout as editInGameLoadoutApi,
  snapshotInGameLoadout as snapshotInGameLoadoutApi,
} from 'app/bungie-api/destiny2-api';
import { t } from 'app/i18next-t';
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
import { inGameLoadoutItemsFromEquipped } from 'app/loadout-drawer/loadout-utils';
import { InGameLoadout } from 'app/loadout/loadout-types';
import { showNotification } from 'app/notifications/notifications';
import { ThunkResult } from 'app/store/types';
import { errorMessage } from 'app/utils/errors';
import { inGameLoadoutDeleted, inGameLoadoutUpdated } from './actions';
import { getItemsFromInGameLoadout } from './ingame-loadout-utils';

/**
 * Ask the API to equip an in-game loadout. You can pass false for apply if you
 * only want to prep the loadout for in-game apply.
 */
export function applyInGameLoadout(loadout: InGameLoadout, apply = true): ThunkResult {
  return async (dispatch, getState) => {
    try {
      const stores = storesSelector(getState());
      const targetStore = getStore(stores, loadout.characterId)!;
      const allItems = allItemsSelector(getState());
      const itemCreationContext = createItemContextSelector(getState());
      const loadoutItems = getItemsFromInGameLoadout(itemCreationContext, loadout.items, allItems);

      const moveLoadout = itemMoveLoadout(
        loadoutItems.map((i) => i.item),
        targetStore,
      );
      return await dispatch(
        applyLoadout(targetStore, moveLoadout, apply ? { inGameLoadout: loadout } : {}),
      );
    } catch {}
  };
}

export function updateAfterInGameLoadoutApply(loadout: InGameLoadout): ThunkResult {
  return async (dispatch, getState) => {
    const stores = storesSelector(getState());
    const itemCreationContext = createItemContextSelector(getState());
    const target = getStore(stores, loadout.characterId)!;
    // Find each item, and update it to be equipped!
    const items = getItemsFromInGameLoadout(
      itemCreationContext,
      loadout.items,
      allItemsSelector(getState()),
    );

    for (const { item } of items) {
      // Update items to be equipped
      // TODO: we don't get updated mod states :-( https://github.com/Bungie-net/api/issues/1792
      const source = getStore(stores, item.owner)!;
      dispatch(
        itemMoved({
          itemHash: item.hash,
          itemId: item.id,
          itemLocation: item.location.hash,
          sourceId: source.id,
          targetId: target.id,
          equip: true,
          amount: 1,
        }),
      );

      // TODO: update the item model to have the right mods plugged. Hard to do
      // this without knowing more about the loadouts structure.
    }

    // TODO: only reload the character that changed
    // Refresh light levels and such
    dispatch(updateCharacters());
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
        body: errorMessage(e),
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
        body: errorMessage(e),
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
        body: errorMessage(e),
      });
    }
  };
}
