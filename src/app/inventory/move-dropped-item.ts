import { DimStore } from './store-types';
import { DimItem } from './item-types';
import { queuedAction } from './action-queue';
import { reportException } from '../exceptions';
import { toaster, ngDialog, loadingTracker } from '../ngimport-more';
import { dimItemService } from './dimItemService.factory';
import { DimError } from '../bungie-api/bungie-service-helper';
import { t } from 'i18next';
import dialogTemplate from './dimStoreBucket.directive.dialog.html';
import { PlatformErrorCodes } from '../../../node_modules/bungie-api-ts/user';

// TODO: A lot going on here. Clean it up and reactify it
const moveDroppedItem = queuedAction(
  (
    target: DimStore,
    item: DimItem,
    equip: boolean,
    $event,
    hovering: boolean
  ) => {
    const promise = doMoveDroppedItem(target, item, equip, $event, hovering);
    loadingTracker.addPromise(promise);
    return promise;
  }
) as typeof doMoveDroppedItem;

export default moveDroppedItem;

async function doMoveDroppedItem(
  target: DimStore,
  item: DimItem,
  equip: boolean,
  shiftPressed: boolean,
  hovering: boolean
) {
  if (item.notransfer && item.owner !== target.id) {
    throw new Error(t('Help.CannotMove'));
  }

  if (item.owner === target.id && !item.location.inPostmaster) {
    if ((item.equipped && equip) || (!item.equipped && !equip)) {
      return;
    }
  }

  let moveAmount = item.amount;

  try {
    if (
      item.maxStackSize > 1 &&
      item.amount > 1 &&
      // TODO: how to do this...
      (shiftPressed || hovering)
    ) {
      ngDialog.closeAll();
      const dialogResult = ngDialog.open({
        // TODO: break this out into a separate service/directive?
        template: dialogTemplate,
        controllerAs: 'vm',
        controller($scope) {
          'ngInject';
          const vm = this;
          vm.item = $scope.ngDialogData;
          vm.moveAmount = vm.item.amount;
          vm.maximum = vm.item
            .getStoresService()
            .getStore(vm.item.owner)!
            .amountOfItem(item);
          vm.stacksWorth = Math.min(
            Math.max(item.maxStackSize - target.amountOfItem(item), 0),
            vm.maximum
          );
          vm.stacksWorthClick = () => {
            vm.moveAmount = vm.stacksWorth;
            vm.finish();
          };
          vm.finish = () => {
            $scope.closeThisDialog(vm.moveAmount);
          };
        },
        plain: true,
        data: item,
        appendTo: 'body',
        overlay: true,
        className: 'move-amount-popup',
        appendClassName: 'modal-dialog'
      });

      const data = await dialogResult.closePromise;
      if (typeof data.value === 'string') {
        const error: DimError = new Error('move-canceled');
        error.code = 'move-canceled';
        throw error;
      }
      moveAmount = data.value;
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

    item = await dimItemService.moveTo(item, target, equip, moveAmount);

    const reload = item.equipped || equip;
    if (reload) {
      await item.getStoresService().updateCharacters();
    }

    item.updateManualMoveTimestamp();
  } catch (e) {
    if (e.message !== 'move-canceled') {
      toaster.pop('error', item.name, e.message);
      console.error('error moving', e, item);
      // Some errors aren't worth reporting
      if (
        e.code !== 'wrong-level' &&
        e.code !== 'no-space' &&
        e.code !== PlatformErrorCodes.DestinyCannotPerformActionAtThisLocation
      ) {
        reportException('moveItem', e);
      }
    }
  }
}
