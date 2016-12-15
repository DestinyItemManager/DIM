(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimMovePopup', MovePopup);

  function MovePopup() {
    return {
      controller: MovePopupController,
      controllerAs: 'vm',
      bindToController: true,
      restrict: 'A',
      scope: {
        store: '=dimStore',
        item: '=dimItem'
      },
      replace: true,
      template: [
        '<div class="move-popup" alt="" title="">',
        '  <div dim-move-item-properties="vm.item" dim-infuse="vm.infuse" change-details="vm.reposition()"></div>',
        '  <dim-move-amount ng-if="vm.item.amount > 1 && !vm.item.notransfer" amount="vm.moveAmount" maximum="vm.maximum"></dim-move-amount>',
        '  <div class="interaction">',
        '    <div class="locations" ng-repeat="store in vm.stores | sortStores:vm.settings.characterOrder track by store.id">',
        '      <div class="move-button move-vault" alt="{{::store.name}}" title="{{::store.name}}" ',
        '        ng-if="vm.canShowVault(vm.item, vm.store, store)" ng-click="vm.moveItemTo(store)" ',
        '        data-type="item" data-character="{{::store.id}}">',
        '        <span>Vault</span>',
        '      </div>',
        '      <div class="move-button move-equip" alt="{{::store.name}}" title="{{::store.name}}" ',
        '        ng-if="!(vm.item.owner == store.id && vm.item.equipped) && vm.item.canBeEquippedBy(store)" ng-click="vm.moveItemTo(store, true)" ',
        '        data-type="equip" data-character="{{::store.id}}" style="background-image: url({{::store.icon}})">',
        '        <span>Equip</span>',
        '      </div>',
        '      <div class="move-button move-store" alt="{{::store.name}}" title="{{::store.name}}" ',
        '        ng-if="vm.canShowStore(vm.item, vm.store, store)" ng-click="vm.moveItemTo(store)" ',
        '        data-type="item" data-character="{{::store.id}}" style="background-image: url({{::store.icon}})"> ',
        '        <span>Store</span>',
        '      </div>',
        '    </div>',
        '    <div class="move-button move-consolidate" alt="Consolidate" title="Consolidate" ',
        '      ng-if="!vm.item.notransfer && vm.item.maxStackSize > 1" ng-click="vm.consolidate()">',
        '      <span>Take</span>',
        '    </div>',
        '    <div class="move-button move-distribute" alt="Distribute Evenly" title="Distribute Evenly" ',
        '      ng-if="!vm.item.notransfer && vm.item.maxStackSize > 1" ng-click="vm.distribute()">',
        '      <span>Split</span>',
        '    </div>',
        '  <div class="locations">',
        '    <div class="move-button infuse-perk" ng-if="vm.item.talentGrid.infusable" ng-click="vm.infuse(vm.item, $event)" translate-attr="{ title: \'Infusion\', alt: \'Infusion.Calc\' }" ng-style="{ \'background-image\': \'url(/images/\' + vm.item.bucket.sort + \'.png)\' }"></div>',
        '  </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  MovePopupController.$inject = ['$scope', 'dimStoreService', 'ngDialog', '$timeout', 'dimSettingsService', 'dimItemMoveService'];

  function MovePopupController($scope, dimStoreService, ngDialog, $timeout, dimSettingsService, dimItemMoveService) {
    var vm = this;
    vm.settings = dimSettingsService;

    var shown = false;

    // Capture the dialog element
    var dialog = null;
    $scope.$on('ngDialog.opened', function(event, $dialog) {
      dialog = $dialog;
      vm.reposition();
    });

    // Reposition the popup as it is shown or if its size changes
    vm.reposition = function() {
      var element = $scope.$parent.ngDialogData;
      if (element) {
        if (!shown) {
          dialog.hide();
        }
        shown = true;
        $timeout(function() {
          dialog
            .position({
              my: 'left bottom',
              at: 'left top-2',
              of: element,
              collision: 'flip flip',
              within: '.store-bounds'
            })
            .show();
        });
      }
    };

    // TODO: cache this, instead?
    $scope.$watch('vm.item', function() {
      if (vm.item.amount > 1) {
        var store = dimStoreService.getStore(vm.item.owner);
        vm.maximum = store.amountOfItem(vm.item);
        vm.moveAmount = vm.maximum;
      }
    });

    /*
    * Open up the dialog for infusion by passing
    * the selected item
    */
    vm.infuse = function infuse(item, e) {
      e.stopPropagation();

      // Close the move-popup
      $scope.$parent.closeThisDialog();

      // Open the infuse window
      ngDialog.open({
        template: 'views/infuse.html',
        className: 'app-settings',
        appendClassName: 'modal-dialog',
        data: item
      });
    };

    function closeThisDialog() {
      $scope.$parent.closeThisDialog();
    }

    vm.consolidate = function() {
      dimItemMoveService.consolidate(vm.item, vm.store, closeThisDialog);
    };

    vm.distribute = function() {
      dimItemMoveService.distribute(vm.item, vm.store, closeThisDialog);
    };

    vm.moveItemTo = function(store, equip) {
      dimItemMoveService.moveItemTo(vm.item, store, equip, vm.moveAmount, closeThisDialog);
    };

    vm.stores = dimStoreService.getStores();

    vm.canShowVault = function canShowButton(item, itemStore, buttonStore) {
      // If my itemStore is the vault, don't show a vault button.
      // Can't vault a vaulted item.
      if (itemStore.isVault) {
        return false;
      }

      // If my buttonStore is the vault, then show a vault button.
      if (!buttonStore.isVault) {
        return false;
      }

      // Can't move this item away from the current itemStore.
      if (item.notransfer) {
        return false;
      }

      return true;
    };

    vm.canShowStore = function canShowButton(item, itemStore, buttonStore) {
      if (buttonStore.isVault) {
        return false;
      }

      if (item.notransfer) {
        if (item.equipped && itemStore.id === buttonStore.id) {
          return true;
        }
      } else if (itemStore.id !== buttonStore.id || item.equipped) {
        return true;
      }

      return false;
    };
  }
})();
