(function () {
  'use strict';

  angular.module('dimApp')
    .directive('dimMovePopup', MovePopup);

  MovePopup.$inject = ['$window', 'ngDialog'];

  function MovePopup($window, ngDialog) {
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
        '<div class="move-popup">',
        '  <div class="locations" ng-repeat="store in vm.stores">',
        '    <div class="move-button move-vault" ng-class="{ \'little\': item.notransfer }" ',
        '      ng-if="vm.canShowVault(vm.item, vm.store, store)" ng-click="vm.MoveToVault(vm.item, store, $event)" ',
        '      data-type="item" data-character="{{ store.id }}">',
        '      <span>Vault</span>',
        '    </div>',
        '    <div class="move-button move-store" ng-class="{ \'little\': item.notransfer }" ',
        '      ng-if="vm.canShowStore(vm.item, vm.store, store)" ng-click="vm.MoveToGuardian(store, $event)" ',
        '      data-type="item" data-character="{{ store.id }}" style="background-image: url(http://bungie.net{{ store.icon }})"> ',
        '      <span>Store</span>',
        '    </div>',
        '    <div class="move-button move-equip" ng-class="{ \'little\': item.notransfer }" ',
        '      ng-if="vm.canShowEquip(vm.item, vm.store, store)" ng-click="vm.MoveToEquip(store, $event)" ',
        '      data-type="equip" data-character="{{ store.id }}" style="background-image: url(http://bungie.net{{ store.icon }})">',
        '      <span>Equip</span>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    }
  }

  MovePopupController.$inject = ['$window', 'dimStoreService', 'ngDialog'];

  function MovePopupController($window, dimStoreService, ngDialog) {
    var vm = this;

    vm.stores = dimStoreService.getStores();

    vm.MoveToVault = function MoveToVault(store, e) {
      var data = e.currentTarget.dataset;

      $window.moveItem(vm.item, data, 1, function () {
        $window.manageItemClick(vm.item, data);
        ngDialog.closeAll();
      });
    };

    vm.MoveToGuardian = vm.MoveToEquip = vm.MoveToVault;

    this.canShowVault = function canShowButton(item, itemStore, buttonStore) {
      // If my itemStore is the vault, don't show a vault button.
      // Can't vault a vaulted item.
      if (itemStore.id === 'vault') {
        return false;
      }

      // If my buttonStore is the vault, then show a vault button.
      if (buttonStore.id !== 'vault') {
        return false;
      }

      // Can't move this item away from the current itemStore.
      if (item.notransfer) {
        return false;
      }

      return true;
    };

    this.canShowStore = function canShowButton(item, itemStore, buttonStore) {
      // if (!item.equipment) {
      //   return false;
      // }

      if (buttonStore.id === 'vault') {
        return false;
      }

      if (item.notransfer && item.equipped && itemStore.id === buttonStore.id) {
        return true;
      }

      if (itemStore.id !== buttonStore.id) {
        return true;
      }

      return false;
    };

    this.canShowEquip = function canShowButton(item, itemStore, buttonStore) {
      if (buttonStore.id === 'vault') {
        return false;
      }

      if (item.notransfer && !item.equipped) {
        return true;
      }

      if (!item.equipped) {
        return true;
      }

      return false;
    };
  }
})();
