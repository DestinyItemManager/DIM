(function () {
  'use strict';

  angular.module('dimApp')
    .directive('dimMovePopup', MovePopup);

  MovePopup.$inject = ['ngDialog'];

  function MovePopup(ngDialog) {
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
        '  <div dim-move-item-properties="vm.item"></div>',
        '  <div class="locations" ng-repeat="store in vm.stores">',
        '    <div class="move-button move-vault" ng-class="{ \'little\': item.notransfer }" ',
        '      ng-if="vm.canShowVault(vm.item, vm.store, store)" ng-click="vm.MoveToVault(store, $event)" ',
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
    };
  }

  MovePopupController.$inject = ['dimStoreService', 'ngDialog'];

  function MovePopupController(dimStoreService, ngDialog) {
    var vm = this;

    vm.stores = dimStoreService.getStores();

    vm.MoveToVault = function MoveToVault(store, e) {
      var current = _.find(vm.store.items, function (item) {
        return ((item.type === vm.item.type) && (vm.item.sort === item.sort) && item.equipped);
      });

      var i = _.indexOf(vm.store.items, vm.item);

      if (i >= 0) {
        vm.store.items.splice(i, 1);
        store.items.push(vm.item);
        vm.item.owner = store.id;
        vm.item.equipped = true;
      }

      i = _.indexOf(vm.store.items, current);

      if (i >= 0) {
        vm.store.items.splice(i, 1);
        store.items.push(current);
        current.owner = store.id;
        current.equipped = false;
      }
    };

    vm.MoveToGuardian = vm.MoveToEquip = vm.MoveToVault;

    vm.canShowItem = function canShowItem(item, itemStore, buttonStore) {
      var result = false;
      // The item is in the vault
      if (item.id === 'vault') {
        if (buttonStore.id === 'vault') { // What to do about sending item back to the vault?
          return false;
        } else { // Send the item to another Guardian.

        }
      } else { // or, the item is in a guardian's inventory
        if (buttonStore.id === 'vault') { // What to do about sending item to the vault?

        } else if (buttonStore.id === item.owner) { // What to about using item with it's owner?

        } else { // Send the item to another Guardian.

        }
      }

      return result;
    };

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
      if (buttonStore.id === 'vault') {
        return false;
      }

      if (!item.notransfer) {
        if (itemStore.id !== buttonStore.id) {
          return true;
        }
      } else {
        if (item.equipped && itemStore.id === buttonStore.id) {
          return true;
        }
      }

      return false;
    };

    this.canShowEquip = function canShowButton(item, itemStore, buttonStore) {
      if (buttonStore.id === 'vault') {
        return false;
      }

      if (!item.notransfer) {
        if (!item.equipped) {
          return true;
        }
      } else {
        if (!item.equipped && itemStore.id === buttonStore.id) {
          return true;
        }
      }

      return false;
    };
  }
})();
