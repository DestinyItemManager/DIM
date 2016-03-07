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
        '  <div dim-move-item-properties="vm.item" dim-infuse="vm.infuse"></div>',
        '  <dim-move-amount ng-if="vm.item.amount > 1" amount="vm.item.moveAmount" maximum="vm.maximum"></dim-move-amount>',
        '  <div class="interaction">',
        '    <div class="locations" ng-repeat="store in vm.stores track by store.id">',
        '      <div class="move-button move-vault" ng-class="{ \'little\': item.notransfer }" alt="{{::vm.characterInfo(store) }}" title="{{::vm.characterInfo(store) }}" ',
        '        ng-if="vm.canShowVault(vm.item, vm.store, store)" ng-click="vm.moveItemTo(store)" ',
        '        data-type="item" data-character="{{::store.id}}">',
        '        <span>Vault</span>',
        '      </div>',
        '      <div class="move-button move-store" ng-class="{ \'little\': item.notransfer }" alt="{{::vm.characterInfo(store) }}" title="{{::vm.characterInfo(store) }}" ',
        '        ng-if="vm.canShowStore(vm.item, vm.store, store)" ng-click="vm.moveItemTo(store)" ',
        '        data-type="item" data-character="{{::store.id}}" style="background-image: url(http://bungie.net{{::store.icon}})"> ',
        '        <span>Store</span>',
        '      </div>',
        '      <div class="move-button move-equip" ng-class="{ \'little\': item.notransfer }" alt="{{::vm.characterInfo(store) }}" title="{{::vm.characterInfo(store) }}" ',
        '        ng-if="vm.canShowEquip(vm.item, vm.store, store)" ng-click="vm.moveItemTo(store, true)" ',
        '        data-type="equip" data-character="{{::store.id}}" style="background-image: url(http://bungie.net{{::store.icon}})">',
        '        <span>Equip</span>',
        '      </div>',
        '    </div>',
        '    <div class="move-button move-consolidate" ng-class="{ \'little\': item.notransfer }" alt="Consolidate" title="Consolidate" ',
        '      ng-if="vm.item.maxStackSize > 1" ng-click="vm.consolidate()">',
        '      <span>Take</span>',
        '    </div>',
        '    <div class="move-button move-distribute" ng-class="{ \'little\': item.notransfer }" alt="Distribute Evenly" title="Distribute Evenly" ',
        '      ng-if="vm.item.maxStackSize > 1" ng-click="vm.distribute()">',
        '      <span>Split</span>',
        '    </div>',
        '  <div class="infuse-perk" ng-if="vm.item.talentGrid.infusable && vm.item.sort !== \'Postmaster\'" ng-click="vm.infuse(vm.item, $event)" title="Infusion calculator" alt="Infusion calculator" style="background-image: url(\'/images/{{vm.item.sort}}.png\');"></div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  MovePopupController.$inject = ['$scope', 'loadingTracker', 'dimStoreService', 'dimItemService', 'ngDialog', '$q', 'toaster'];

  function MovePopupController($scope, loadingTracker, dimStoreService, dimItemService, ngDialog, $q, toaster) {
    var vm = this;

    // TODO: cache this, instead?
    $scope.$watch('vm.item', function() {
      if (vm.item.amount > 1) {
        // TODO: sum up all the quantity of the item
        vm.item.moveAmount = vm.item.amount;
        dimStoreService.getStore(vm.item.owner)
          .then(function(store) {
            vm.maximum = store.amountOfItem(vm.item);
            vm.item.moveAmount = vm.maximum;
          });
      }
    });

    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /*
    * Open up the dialog for infusion by passing
    * the selected item
    */
    vm.infuse = function infuse(item, e) {
      if (item.sort === 'Postmaster') {
        return;
      }
      e.stopPropagation();

      // Close the move-popup
      $scope.$parent.closeThisDialog();

      // Open the infuse window
      ngDialog.open({
        template: 'views/infuse.html',
        overlay: false,
        className: 'app-settings',
        data: item,
        scope: $('#infuseDialog').scope()
      });
    };

    vm.characterInfo = function characterInfo(store) {
      if (store.id === 'vault') {
        return 'Vault';
      } else {
        return store.level + ' ' + capitalizeFirstLetter(store.race) + ' ' + capitalizeFirstLetter(store.gender) + ' ' + capitalizeFirstLetter(store.class);
      }
    };

    /**
     * Move the item to the specified store. Equip it if equip is true.
     */
    vm.moveItemTo = function moveItemTo(store, equip) {
      var dimStores;
      var reload = vm.item.equipped || equip;
      var promise = dimItemService.moveTo(vm.item, store, equip);

      if (reload) {
        promise = promise.then(dimStoreService.getStores)
          .then(function(stores) {
            dimStores = dimStoreService.updateStores(stores);
          });
      }

      promise = promise
        .then(function() {
          setTimeout(function() { dimStoreService.setHeights(); }, 0);
        })
        .catch(function(a) {
          toaster.pop('error', vm.item.name, a.message);
        });

      loadingTracker.addPromise(promise);
      $scope.$parent.closeThisDialog();
      return promise;
    };

    vm.consolidate = function() {
      var stores = _.filter(dimStoreService.getStores(), function(s) { return s.id !== vm.item.owner && s.id !== 'vault'; });
      var vault = _.findWhere(dimStoreService.getStores(), { id: 'vault' });
      var promise = $q.when();

      // Do the moves serially for now
      stores.forEach(function(store) {
        // First move everything into the vault
        promise = promise.then(function() {
          var item = _.findWhere(store.items, { hash: vm.item.hash });
          if (item) {
            var amount = store.amountOfItem(vm.item);
            item.moveAmount = amount;
            return dimItemService.moveTo(item, vault, false);
          }
        });
      });

      // Then move from the vault to the character
      if (vm.store.id !== 'vault') {
        promise = promise.then(function() {
          var item = _.findWhere(vault.items, { hash: vm.item.hash });
          if (item) {
            var amount = vault.amountOfItem(vm.item);
            item.moveAmount = amount;
            return dimItemService.moveTo(item, vm.store, false);
          }
        });
      }

      promise = promise.then(function() {
        setTimeout(function() { dimStoreService.setHeights(); }, 0);
        toaster.pop('success', 'Consolidated ' + vm.item.name, 'All ' + vm.item.name + ' is now on your ' + vm.store.race + " " + vm.store.class + ".");
      })
      .catch(function(a) {
        toaster.pop('error', vm.item.name, a.message);
      });

      loadingTracker.addPromise(promise);
      $scope.$parent.closeThisDialog();
      return promise;
    };

    vm.distribute = function() {
      var stores = stores = _.filter(dimStoreService.getStores(), function(s) { return s.id !== 'vault'; });

      var total = 0;
      var amounts = stores.map(function(store) {
        var amount = store.amountOfItem(vm.item);
        total += amount;
        return amount;
      });

      var remainder = total % stores.length;
      var targets = stores.map(function(store) {
        var result;
        if (remainder > 0) {
          result = Math.ceil(total / stores.length);
        } else {
          result = Math.floor(total / stores.length);
        }
        remainder--;
        return result;
      });
      var deltas = _.zip(amounts, targets).map(function(pair) {
        return pair[1] - pair[0];
      });

      var moves = [];
      var iter = 0;
      while(iter < 10 && _.any(deltas, function(d) { return d !== 0; })) {
        var sourceIndex = _.findIndex(deltas, function(d) { return d < 0; });
        var targetIndex = _.findIndex(deltas, function(d) { return d > 0; });

        var amount = Math.min(-1 * deltas[sourceIndex], deltas[targetIndex]);
        moves.push({
          source: stores[sourceIndex],
          target: stores[targetIndex],
          amount: amount
        });

        deltas[sourceIndex] += amount;
        deltas[targetIndex] -= amount;
        iter++;
      }

      var promise = $q.when();

      moves.forEach(function(move) {
        promise = promise.then(function() {
          var item = _.findWhere(move.source.items, { hash: vm.item.hash });
          item.moveAmount = move.amount;
          return dimItemService.moveTo(item, move.target, false);
        });
      });

      promise = promise.then(function() {
        setTimeout(function() { dimStoreService.setHeights(); }, 0);
        toaster.pop('success', 'Distributed ' + vm.item.name, vm.item.name + ' is now equally divided between characters.');
      })
      .catch(function(a) {
        toaster.pop('error', vm.item.name, a.message);
      });

      loadingTracker.addPromise(promise);
      $scope.$parent.closeThisDialog();
      return promise;
    };

    dimStoreService.getStores(false, true)
      .then(function(stores) {
        vm.stores = stores;
      });

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

    vm.canShowVault = function canShowButton(item, itemStore, buttonStore) {
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

    vm.canShowStore = function canShowButton(item, itemStore, buttonStore) {
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

    vm.canShowEquip = function canShowButton(item, itemStore, buttonStore) {
      if (buttonStore.id === 'vault' || !item.equipment) {
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
