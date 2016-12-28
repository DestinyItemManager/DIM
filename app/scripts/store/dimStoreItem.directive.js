(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreItem', StoreItem)
    .filter('tagIcon', ['dimSettingsService', function(dimSettingsService) {
      var iconType = {};

      dimSettingsService.itemTags.forEach((tag) => {
        if (tag.type) {
          iconType[tag.type] = tag.icon;
        }
      });

      return function tagIcon(value) {
        var icon = iconType[value];
        if (icon) {
          return "item-tag fa fa-" + icon;
        } else {
          return "item-tag no-tag";
        }
      };
    }]);


  StoreItem.$inject = ['dimItemService', 'dimStoreService', 'ngDialog', 'dimLoadoutService', 'dimCompareService', '$rootScope', 'dimActionQueue'];

  function StoreItem(dimItemService, dimStoreService, ngDialog, dimLoadoutService, dimCompareService, $rootScope, dimActionQueue) {
    var otherDialog = null;
    let firstItemTimed = false;

    return {
      bindToController: true,
      controller: StoreItemCtrl,
      controllerAs: 'vm',
      link: Link,
      replace: true,
      restrict: 'E',
      scope: {
        store: '=storeData',
        item: '=itemData',
        shiftClickCallback: '=shiftClickCallback',
        altClickCallback: '=altClickCallback',

      },
      template: [
        '<div ui-draggable="{{ ::vm.draggable }}" id="{{ ::vm.item.index }}" drag-channel="{{ ::vm.dragChannel }}" ',
        '  title="{{vm.item.primStat.value}} {{::vm.item.name}}" ',
        '  drag="::vm.item.index"',
        '  class="item"',
        '  ng-class="{',
        "    'search-hidden': !vm.item.visible",
        '  }">',
        '  <div class="item-elem" ng-class="{',
        "    'complete': vm.item.complete",
        '  }">',
        '    <div class="item-xp-bar item-xp-bar-small" ng-if="vm.item.percentComplete && !vm.item.complete">',
        '      <div dim-percent-width="vm.item.percentComplete"></div>',
        '    </div>',
        '    <div class="img" ng-style="::vm.item.icon | bungieBackground" ng-click="vm.clicked(vm.item, $event)" ng-dblclick="vm.doubleClicked(vm.item, $event)">',
        '    <div ng-if="vm.item.quality" class="item-stat item-quality" ng-style="vm.item.quality.min | qualityColor">{{ vm.item.quality.min }}%</div>',
        '    <img class="element" ng-if=":: vm.item.dmg && vm.item.dmg !== \'kinetic\'" ng-src="/images/{{::vm.item.dmg}}.png"/>',
        '    <span ng-class="vm.item.dimInfo.tag | tagIcon"></span>',
        '    <div ng-if="vm.item.isNew" class="new_overlay_overflow">',
        '      <img class="new_overlay" src="/images/overlay.svg" height="44" width="44"/>',
        '    </div>',
        '    <div ng-class="vm.badgeClassNames" ng-if="vm.showBadge">{{ vm.badgeCount }}</div>',
        '  </div>',
        '</div>'
      ].join('')
    };

    function Link(scope, element) {
      if (!firstItemTimed) {
        console.timeEnd('First item directive built');
        firstItemTimed = true;
      }

      var vm = scope.vm;
      var dialogResult = null;

      var dragHelp = document.getElementById('drag-help');

      if (vm.item.maxStackSize > 1) {
        element.on('dragstart', function(e) {
          $rootScope.dragItem = vm.item; // Kind of a hack to communicate currently-dragged item
          if (vm.item.amount > 1) {
            dragHelp.classList.remove('drag-help-hidden');
          }
        });
        element.on('dragend', function() {
          dragHelp.classList.add('drag-help-hidden');
          delete $rootScope.dragItem;
        });
        element.on('drag', function(e) {
          if (e.shiftKey) {
            dragHelp.classList.add('drag-shift-activated');
          } else {
            dragHelp.classList.remove('drag-shift-activated');
          }
        });
      }

      vm.doubleClicked = dimActionQueue.wrap(function(item, e) {
        if (!dimLoadoutService.dialogOpen && !dimCompareService.dialogOpen) {
          e.stopPropagation();
          const active = dimStoreService.getActiveStore();

          // Equip if it's not equipped or it's on another character
          const equip = !item.equipped || item.owner !== active.id;

          dimItemService.moveTo(item, active, item.canBeEquippedBy(active) ? equip : false, item.amount)
            .then(function() {
              return dimStoreService.updateCharacters();
            });
        }
      });

      vm.clicked = function openPopup(item, e) {
        e.stopPropagation();

        if (vm.altClickCallback && e.altKey) {
          vm.altClickCallback(item, e);
          return;
        }

        if (vm.shiftClickCallback && e.shiftKey) {
          vm.shiftClickCallback(item);
          return;
        }

        dimStoreService.dropNewItem(item);

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
            template: '<div ng-click="$event.stopPropagation();" dim-click-anywhere-but-here="closeThisDialog()" dim-move-popup dim-store="vm.store" dim-item="vm.item"></div>',
            plain: true,
            overlay: false,
            className: 'move-popup-dialog',
            showClose: false,
            data: element,
            scope: scope,
            // Setting these focus options prevents the page from
            // jumping as dialogs are shown/hidden
            trapFocus: false,
            preserveFocus: false
          });
          otherDialog = dialogResult;

          dialogResult.closePromise.then(function() {
            dialogResult = null;
          });
        }
      };

      scope.$on('$destroy', function() {
        if (dialogResult) {
          dialogResult.close();
        }
      });

      vm.badgeClassNames = {};

      if (!vm.item.primStat && vm.item.objectives) {
        scope.$watchGroup([
          'vm.item.percentComplete',
          'vm.item.complete'], function() {
          processBounty(vm, vm.item);
        });
      } else if (vm.item.maxStackSize > 1) {
        scope.$watchGroup([
          'vm.item.amount'], function() {
          processStackable(vm, vm.item);
        });
      } else {
        scope.$watch('vm.item.primStat.value', function() {
          processItem(vm, vm.item);
        });
      }

      scope.$watch('vm.item.quality', function() {
        vm.badgeClassNames['item-stat-no-bg'] = vm.item.quality;
      });
    }
  }

  function processBounty(vm, item) {
    var showBountyPercentage = !item.complete;
    vm.showBadge = showBountyPercentage;

    if (showBountyPercentage) {
      vm.badgeClassNames = { 'item-stat': true, 'item-bounty': true };
      vm.badgeCount = Math.floor(100.0 * item.percentComplete) + '%';
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

    vm.showBadge = item.primStat && item.primStat.value;

    if (vm.showBadge) {
      vm.badgeClassNames['item-stat'] = true;

      vm.badgeClassNames['stat-damage-' + item.dmg] = true;
      vm.badgeCount = item.primStat.value;
    }
  }

  StoreItemCtrl.$inject = [];

  function StoreItemCtrl() {
    var vm = this;

    vm.dragChannel = (vm.item.notransfer) ? vm.item.owner + vm.item.location.type : vm.item.location.type;
    vm.draggable = (vm.item.equipment || vm.item.location.hasTransferDestination) && !vm.item.location.inPostmaster;
  }
})();
