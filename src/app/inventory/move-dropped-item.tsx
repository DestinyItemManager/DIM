import { DimStore } from './store-types';
import { DimItem } from './item-types';
import { queuedAction } from './action-queue';
import { reportException } from '../utils/exceptions';
import { dimItemService } from './item-move-service';
import { DimError } from '../bungie-api/bungie-service-helper';
import { t } from 'app/i18next-t';
import { PlatformErrorCodes } from 'bungie-api-ts/user';
import { loadingTracker } from '../shell/loading-tracker';
import { showNotification } from '../notifications/notifications';
import { Subject } from 'rxjs';
import { hideItemPopup } from 'app/item-popup/item-popup';
import BungieImage from 'app/dim-ui/BungieImage';
import React from 'react';

export interface MoveAmountPopupOptions {
  item: DimItem;
  targetStore: DimStore;
  amount: number;
  maximum: number;
  onAmountSelected(amount: number);
  onCancel(): void;
}

export const showMoveAmountPopup$ = new Subject<MoveAmountPopupOptions>();

export function showMoveAmountPopup(
  item: DimItem,
  targetStore: DimStore,
  maximum: number
): Promise<number> {
  return new Promise((resolve, reject) => {
    showMoveAmountPopup$.next({
      item,
      targetStore,
      amount: item.amount,
      maximum,
      onAmountSelected: resolve,
      onCancel: reject
    });
  });
}

export default queuedAction(
  loadingTracker.trackPromise(
    async (target: DimStore, item: DimItem, equip: boolean, forceChooseAmount: boolean) => {
      if (item.notransfer && item.owner !== target.id) {
        throw new Error(t('Help.CannotMove'));
      }

      if (item.owner === target.id && !item.location.inPostmaster) {
        if ((item.equipped && equip) || (!item.equipped && !equip)) {
          return;
        }
      }

      let moveAmount = item.amount || 1;

      try {
        // Select how much of a stack to move
        if (
          item.maxStackSize > 1 &&
          item.amount > 1 &&
          // https://github.com/DestinyItemManager/DIM/issues/3373
          !item.uniqueStack &&
          forceChooseAmount
        ) {
          const maximum = item
            .getStoresService()
            .getStore(item.owner)!
            .amountOfItem(item);

          try {
            moveAmount = await showMoveAmountPopup(item, target, maximum);
          } catch (e) {
            const error: DimError = new Error('move-canceled');
            error.code = 'move-canceled';
            throw error;
          }
        }

        if ($featureFlags.debugMoves) {
          console.log(
            'User initiated move:',
            moveAmount,
            item.name,
            item.type,
            'to',
            target.name,
            'from',
            item.getStoresService().getStore(item.owner)!.name
          );
        }

        hideItemPopup();
        const movePromise = dimItemService.moveTo(item, target, equip, moveAmount);

        // TODO: extend the notification and add an undo button?
        showNotification({
          duration: movePromise,
          title: item.name,
          body: (
            <div>
              <BungieImage src={item.icon} /> => <img src={target.icon} />
            </div>
          )
        });

        item = await movePromise;

        const reload = item.equipped || equip;
        if (reload) {
          await item.getStoresService().updateCharacters();
        }

        item.updateManualMoveTimestamp();
      } catch (e) {
        if (e.message !== 'move-canceled') {
          showNotification({ type: 'error', title: item.name, body: e.message });
          console.error('error moving', e, item);
          // Some errors aren't worth reporting
          if (
            e.code !== 'wrong-level' &&
            e.code !== 'no-space' &&
            e.code !== PlatformErrorCodes.DestinyCannotPerformActionAtThisLocation &&
            e.code !== PlatformErrorCodes.DestinyItemNotFound
          ) {
            reportException('moveItem', e);
          }
        }
      }
    }
  )
);
