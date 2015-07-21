(function() {
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
        '<div class="move-popup" alt="" title="">',
        '  <div dim-move-item-properties="vm.item"></div>',
        '  <div class="locations" ng-repeat="store in vm.stores track by store.id">',
        '    <div class="move-button move-vault" ng-class="{ \'little\': item.notransfer }" alt="{{ vm.characterInfo(store) }}" title="{{ vm.characterInfo(store) }}" ',
        '      ng-if="vm.canShowVault(vm.item, vm.store, store)" ng-click="vm.moveToVault(store, $event)" ',
        '      data-type="item" data-character="{{ store.id }}">',
        '      <span>Vault</span>',
        '    </div>',
        '    <div class="move-button move-store" ng-class="{ \'little\': item.notransfer }" alt="{{ vm.characterInfo(store) }}" title="{{ vm.characterInfo(store) }}" ',
        '      ng-if="vm.canShowStore(vm.item, vm.store, store)" ng-click="vm.moveToGuardian(store, $event)" ',
        '      data-type="item" data-character="{{ store.id }}" style="background-image: url(http://bungie.net{{ store.icon }})"> ',
        '      <span>Store</span>',
        '    </div>',
        '    <div class="move-button move-equip" ng-class="{ \'little\': item.notransfer }" alt="{{ vm.characterInfo(store) }}" title="{{ vm.characterInfo(store) }}" ',
        '      ng-if="vm.canShowEquip(vm.item, vm.store, store)" ng-click="vm.moveToEquip(store, $event)" ',
        '      data-type="equip" data-character="{{ store.id }}" style="background-image: url(http://bungie.net{{ store.icon }})">',
        '      <span>Equip</span>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  MovePopupController.$inject = ['$rootScope', 'dimStoreService', 'dimItemService', 'ngDialog', '$q', 'toaster'];

  function MovePopupController($rootScope, dimStoreService, dimItemService, ngDialog, $q, toaster) {
    var vm = this;

    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    vm.characterInfo = function characterInfo(store) {
      if (store.id === 'vault') {
        return 'Vault';
      } else {
        return store.level + ' ' + capitalizeFirstLetter(store.race) + ' ' + capitalizeFirstLetter(store.gender) + ' ' + capitalizeFirstLetter(store.class);
      }
    };

    function moveItemUI(item, targetStore) {
      var sourceStore = (item.owner === targetStore.id) ? $q.when(targetStore) : dimStoreService.getStore(item.owner);

      return sourceStore
        .then(function(sourceStore) {
          var i = _.indexOf(sourceStore.items, item);

          if (i >= 0) {
            sourceStore.items.splice(i, 1);
            targetStore.items.push(item);
            item.owner = targetStore.id;
          }
        });
    }

    function moveToGuardianFn(store, e) {
      var promise = dimItemService.moveTo(vm.item, store)
      .catch(function(a) {
        toaster.pop('error', vm.item.name, a.message);
      });

      $rootScope.loadingTracker.addPromise(promise);
    }

    function moveToVaultFn(store, e) {
      var promise = dimItemService.moveTo(vm.item, store)
        .catch(function(a) {
          toaster.pop('error', vm.item.name, a.message);
        });

      $rootScope.loadingTracker.addPromise(promise);
    }

    function moveToEquipFn(store, e) {
      var promise = dimItemService.moveTo(vm.item, store, true)
        .catch(function(a) {
          toaster.pop('error', vm.item.name, a.message);
        });

      $rootScope.loadingTracker.addPromise(promise);
    }

    vm.moveToVault = moveToVaultFn;
    vm.moveToEquip = moveToEquipFn;
    vm.moveToGuardian = moveToGuardianFn;

    vm.stores = dimStoreService.getStores();

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
        } else if (item.equipped) {
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

      if (!item.equipment) {
        return false;
      }

      if (!item.notransfer) {
        if ((itemStore.id !== buttonStore.id) && (item.sort !== 'Postmaster')) {
          return true;
        } else if ((!item.equipped) && (item.sort !== 'Postmaster')) {
          return true;
        }
      } else {
        if ((!item.equipped) && (itemStore.id === buttonStore.id) && (item.sort !== 'Postmaster')) {
          return true;
        }
      }

      return false;
    };
  }
})();
