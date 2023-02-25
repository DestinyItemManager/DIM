import { currentAccountSelector } from 'app/accounts/selectors';
import { equipInGameLoadout } from 'app/bungie-api/destiny2-api';
import { itemMoved } from 'app/inventory/actions';
import { updateCharacters } from 'app/inventory/d2-stores';
import { inGameLoadoutNotification } from 'app/inventory/MoveNotifications';
import { allItemsSelector, storesSelector } from 'app/inventory/selectors';
import { getStore } from 'app/inventory/stores-helpers';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { showNotification } from 'app/notifications/notifications';
import { loadingTracker } from 'app/shell/loading-tracker';
import { ThunkResult } from 'app/store/types';
import { queueAction } from 'app/utils/action-queue';
import { DimError } from 'app/utils/dim-error';
import { reportException } from 'app/utils/exceptions';
import { errorLog } from 'app/utils/log';
import { PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import { getItemsFromInGameLoadout } from './ingame-loadout-utils';

/**
 * Ask the API to equip a loadout.
 */
export function applyInGameLoadout(loadout: InGameLoadout): ThunkResult {
  return async (dispatch, getState) => {
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
      const items = getItemsFromInGameLoadout(loadout.items, allItemsSelector(getState()));

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
