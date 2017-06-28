import angular from 'angular';
import template from './dimStoreItem.directive.html';
import dialogTemplate from './dimStoreItem.directive.dialog.html';

angular.module('dimApp')
  .directive('dimStoreItem', StoreItem)
  .filter('tagIcon', (dimSettingsService) => {
    const iconType = {};

    dimSettingsService.itemTags.forEach((tag) => {
      if (tag.type) {
        iconType[tag.type] = tag.icon;
      }
    });

    return function tagIcon(value) {
      const icon = iconType[value];
      if (icon) {
        return `item-tag fa fa-${icon}`;
      } else {
        return "item-tag no-tag";
      }
    };
  });

function StoreItem(dimItemService, dimStoreService, ngDialog, dimLoadoutService, dimCompareService, $rootScope, dimActionQueue, NewItemsService) {
  let otherDialog = null;
  let firstItemTimed = false;

  return {
    bindToController: true,
    controller: StoreItemCtrl,
    controllerAs: 'vm',
    link: Link,
    replace: true,
    restrict: 'E',
    scope: {
      item: '=itemData',
      shiftClickCallback: '=shiftClickCallback'
    },
    template: template
  };

  function Link(scope, element) {
    if (!firstItemTimed) {
      firstItemTimed = true;
    }

    const vm = scope.vm;
    let dialogResult = null;

    const dragHelp = document.getElementById('drag-help');

    if (vm.item.maxStackSize > 1) {
      element.on('dragstart', (e) => {
        $rootScope.dragItem = vm.item; // Kind of a hack to communicate currently-dragged item
        if (vm.item.amount > 1) {
          dragHelp.classList.remove('drag-help-hidden');
        }
      });
      element.on('dragend', () => {
        dragHelp.classList.add('drag-help-hidden');
        delete $rootScope.dragItem;
      });
      element.on('drag', (e) => {
        if (e.shiftKey) {
          dragHelp.classList.add('drag-shift-activated');
        } else {
          dragHelp.classList.remove('drag-shift-activated');
        }
      });
    }

    vm.doubleClicked = dimActionQueue.wrap((item, e) => {
      if (!dimLoadoutService.dialogOpen && !dimCompareService.dialogOpen) {
        e.stopPropagation();
        const active = dimStoreService.getActiveStore();

        // Equip if it's not equipped or it's on another character
        const equip = !item.equipped || item.owner !== active.id;

        dimItemService.moveTo(item, active, item.canBeEquippedBy(active) ? equip : false, item.amount)
          .then(() => {
            return dimStoreService.updateCharacters();
          });
      }
    });

    vm.clicked = function clicked(item, e) {
      e.stopPropagation();

      $rootScope.$broadcast('item-clicked', item);

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
      } else if (dimCompareService.dialogOpen) {
        dimCompareService.addItemToCompare(item, e);
      } else {
        dialogResult = ngDialog.open({
          template: dialogTemplate,
          plain: true,
          overlay: false,
          className: 'move-popup-dialog',
          showClose: false,
          data: element,
          controllerAs: 'vm',
          controller: function() {
            'ngInject';
            this.item = vm.item;
            this.store = dimStoreService.getStore(this.item.owner);
          },

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

    scope.$on('$destroy', () => {
      if (dialogResult) {
        dialogResult.close();
      }
    });

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
  }
}

function processBounty(vm, item) {
  const showBountyPercentage = !item.complete;
  vm.showBadge = showBountyPercentage;

  if (showBountyPercentage) {
    vm.badgeClassNames = { 'item-stat': true, 'item-bounty': true };
    vm.badgeCount = `${Math.floor(100.0 * item.percentComplete)}%`;
  }
}

function processStackable(vm, item) {
  vm.showBadge = true;
  vm.badgeClassNames = { 'item-stat': true, 'item-stackable': true };
  vm.badgeCount = item.amount;
}

function processItem(vm, item) {
  vm.badgeClassNames = {
    'item-equipment': true
  };

  vm.showBadge = Boolean(item.primStat && item.primStat.value);

  if (vm.showBadge) {
    vm.badgeClassNames['item-stat'] = true;
    vm.badgeCount = item.primStat.value;
  }
}

function StoreItemCtrl() {
  const vm = this;

  vm.dragChannel = (vm.item.notransfer) ? vm.item.owner + vm.item.location.type : vm.item.location.type;
  vm.draggable = !vm.item.location.inPostmaster &&
    (vm.item.notransfer)
    ? vm.item.equipment
    : (vm.item.equipment || vm.item.location.hasTransferDestination);
}
