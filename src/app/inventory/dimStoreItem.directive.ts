import { NewItemsService } from './store/new-items.service';
import dialogTemplate from './dimStoreItem.directive.dialog.html';
import template from './dimStoreItem.directive.html';
import './InventoryItem.scss';
import { IComponentOptions, IController, IScope, IRootElementService } from 'angular';
import { dimLoadoutService } from '../loadout/loadout.service';
import { DimItem } from './item-types';
import { CompareService } from '../compare/compare.service';

export const StoreItemComponent: IComponentOptions = {
  controller: StoreItemCtrl,
  controllerAs: 'vm',
  bindings: {
    item: '<itemData',
    shiftClickCallback: '&shiftClickCallback'
  },
  template
};

let otherDialog: any = null;

// TODO: replace with a react component using react2angular?
export function StoreItemCtrl(
  this: IController & {
    item: DimItem;
    shiftClickCallback(item: DimItem): void;
  },
  $scope: IScope,
  $element: IRootElementService,
  ngDialog
) {
  'ngInject';

  const vm = this;
  let dialogResult: any = null;

  vm.$onInit = () => {
    // Perf hack: the item's "index" property is computed based on:
    //  * its ID
    //  * amount (and a unique-ifier) if it's a stackable
    //  * primary stat
    //  * completion percentage
    //  * quality minimum
    //
    // As a result we can bind-once or compute up front properties that depend
    // on those values, since if any of them change, the *entire* item directive
    // will be recreated from scratch. This is cheaper overall since the number of
    // items that get infused or have XP added to them in any given refresh is much
    // smaller than the number of items that don't.
    //
    // Note that this hack means that dim-store-items used outside of ng-repeat won't
    // update!

    vm.badgeClassNames = {};

    if (!vm.item.primStat && vm.item.objectives) {
      processBounty(vm, vm.item);
    } else if (vm.item.maxStackSize > 1) {
      processStackable(vm, vm.item);
    } else {
      processItem(vm, vm.item);
    }

    // TODO: once we rewrite this in react and don't need the perf hack, we should show ghost affinity and flavor objective here

    vm.dragChannel =
      vm.item.notransfer || (vm.item.location.inPostmaster && vm.item.destinyVersion === 2)
        ? vm.item.owner + vm.item.bucket.type
        : vm.item.bucket.type;
    vm.draggable =
      (!vm.item.location.inPostmaster || vm.item.destinyVersion === 2) && vm.item.notransfer
        ? vm.item.equipment
        : vm.item.equipment || vm.item.bucket.hasTransferDestination;
  };

  vm.clicked = function clicked(item: DimItem, e: MouseEvent) {
    e.stopPropagation();

    if (vm.shiftClickCallback && e.shiftKey) {
      vm.shiftClickCallback(item);
      return;
    }

    NewItemsService.dropNewItem(item);

    if (otherDialog) {
      if (ngDialog.isOpen(otherDialog.id)) {
        otherDialog.close();
      }
      otherDialog = null;
    }

    if (dialogResult) {
      if (ngDialog.isOpen(dialogResult.id)) {
        dialogResult.close();
        dialogResult = null;
      }
    } else if (dimLoadoutService.dialogOpen) {
      dimLoadoutService.addItemToLoadout(item, e);
    } else if (CompareService.dialogOpen) {
      CompareService.addItemToCompare(item);
    } else {
      // This is separate to hopefully work around an issue where Angular can't instantiate the controller with ES6 object shorthands
      function dialogController() {
        'ngInject';
        this.item = vm.item;
        this.store = item.getStoresService().getStore(this.item.owner);
      }

      dialogResult = ngDialog.open({
        template: dialogTemplate,
        plain: true,
        overlay: false,
        className: 'move-popup-dialog',
        showClose: false,
        data: $element[0],
        controllerAs: 'vm',
        controller: dialogController,
        // Setting these focus options prevents the page from
        // jumping as dialogs are shown/hidden
        trapFocus: false,
        preserveFocus: false
      });
      otherDialog = dialogResult;

      dialogResult.closePromise.then(() => {
        dialogResult = null;
      });
    }
  };

  $scope.$on('$destroy', () => {
    if (dialogResult) {
      dialogResult.close();
    }
  });

  function processBounty(vm, item: DimItem) {
    const showBountyPercentage = !item.complete && !item.hidePercentage;
    vm.showBadge = showBountyPercentage;

    if (showBountyPercentage) {
      vm.badgeClassNames = { 'item-stat': true, 'item-bounty': true };
      vm.badgeCount = `${Math.floor(100 * item.percentComplete)}%`;
    }
  }

  function processStackable(vm, item: DimItem) {
    vm.showBadge = true;
    vm.badgeClassNames = { 'item-stat': true, 'item-stackable': true };
    vm.badgeCount = item.amount;
  }

  function processItem(vm, item: DimItem) {
    vm.badgeClassNames = {
      'item-equipment': true
    };

    vm.showBadge = Boolean(item.primStat && item.primStat.value);

    if (item.primStat && vm.showBadge) {
      vm.badgeClassNames['item-stat'] = true;
      vm.badgeCount = item.primStat.value;
    }
  }
}
