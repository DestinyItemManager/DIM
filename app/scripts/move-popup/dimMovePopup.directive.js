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
        '  <dim-move-amount ng-if="vm.item.amount > 1 && !vm.item.notransfer" amount="vm.moveAmount" maximum="vm.maximum"></dim-move-amount>',
        '  <div class="interaction">',
        '    <div class="locations" ng-repeat="store in vm.stores track by store.id">',
        '      <div class="move-button move-vault" alt="{{::vm.characterInfo(store) }}" title="{{::vm.characterInfo(store) }}" ',
        '        ng-if="vm.canShowVault(vm.item, vm.store, store)" ng-click="vm.moveItemTo(store)" ',
        '        data-type="item" data-character="{{::store.id}}">',
        '        <span>Vault</span>',
        '      </div>',
        '      <div class="move-button move-store" alt="{{::vm.characterInfo(store) }}" title="{{::vm.characterInfo(store) }}" ',
        '        ng-if="vm.canShowStore(vm.item, vm.store, store)" ng-click="vm.moveItemTo(store)" ',
        '        data-type="item" data-character="{{::store.id}}" style="background-image: url({{::store.icon}})"> ',
        '        <span>Store</span>',
        '      </div>',
        '      <div class="move-button move-equip" alt="{{::vm.characterInfo(store) }}" title="{{::vm.characterInfo(store) }}" ',
        '        ng-if="vm.item.canBeEquippedBy(store)" ng-click="vm.moveItemTo(store, true)" ',
        '        data-type="equip" data-character="{{::store.id}}" style="background-image: url({{::store.icon}})">',
        '        <span>Equip</span>',
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
        '  <div class="infuse-perk" ng-if="vm.item.talentGrid.infusable" ng-click="vm.infuse(vm.item, $event)" title="Infusion fuel finder" alt="Infusion calculator" ng-style="{ \'background-image\': \'url(/images/\' + vm.item.bucket.sort + \'.png)\' }"></div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  MovePopupController.$inject = ['$scope', 'loadingTracker', 'dimStoreService', 'dimItemService', 'ngDialog', '$q', 'toaster', 'dimActionQueue', 'dimInfoService'];

  function MovePopupController($scope, loadingTracker, dimStoreService, dimItemService, ngDialog, $q, toaster, dimActionQueue, dimInfoService) {
    var vm = this;

    // TODO: cache this, instead?
    $scope.$watch('vm.item', function() {
      if (vm.item.amount > 1) {
        var store = dimStoreService.getStore(vm.item.owner);
        vm.maximum = store.amountOfItem(vm.item);
        vm.moveAmount = vm.maximum;
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
      e.stopPropagation();

      // Close the move-popup
      $scope.$parent.closeThisDialog();

      // Open the infuse window
      ngDialog.open({
        template: 'views/infuse.html',
        className: 'app-settings',
        data: item,
        scope: $('#infuseDialog').scope()
      });
    };

    vm.characterInfo = function characterInfo(store) {
      if (store.isVault) {
        return 'Vault';
      } else {
        return store.level + ' ' + capitalizeFirstLetter(store.race) + ' ' + capitalizeFirstLetter(store.gender) + ' ' + capitalizeFirstLetter(store.class);
      }
    };

    /**
     * Move the item to the specified store. Equip it if equip is true.
     */
    vm.moveItemTo = dimActionQueue.wrap(function moveItemTo(store, equip) {
      dimInfoService.show('movebox', {
        title: 'Did you know?',
        body: ['<p>Items can be dragged and dropped between different characters/vault columns.</p>',
               '<p>Try it out next time!<p>'].join(''),
        hide: 'Don\'t show this tip again'
      });

      var reload = vm.item.equipped || equip;
      var promise = dimItemService.moveTo(vm.item, store, equip, vm.moveAmount);

      if (reload) {
        // Refresh light levels and such
        promise = promise.then(function() {
          return dimStoreService.updateCharacters();
        });
      }

      promise = promise
        .then(function() {
          dimStoreService.setHeights();
        })
        .catch(function(a) {
          toaster.pop('error', vm.item.name, a.message);
        });

      loadingTracker.addPromise(promise);
      $scope.$parent.closeThisDialog();
      return promise;
    });

    vm.consolidate = dimActionQueue.wrap(function() {
      var stores = _.filter(dimStoreService.getStores(), function(s) { return s.id !== vm.item.owner && !s.isVault; });
      var vault = dimStoreService.getVault();

      var promise = $q.all(stores.map(function(store) {
        // First move everything into the vault
        var item = _.find(store.items, function(i) {
          return i.hash === vm.item.hash && !i.location.inPostmaster;
        });
        if (item) {
          var amount = store.amountOfItem(vm.item);
          return dimItemService.moveTo(item, vault, false, amount);
        }
      }));

      // Then move from the vault to the character
      if (!vm.store.isVault) {
        promise = promise.then(function() {
          var item = _.find(vault.items, function(i) {
            return i.hash === vm.item.hash && i.location.inPostmaster;
          });
          if (item) {
            var amount = vault.amountOfItem(vm.item);
            return dimItemService.moveTo(item, vm.store, false, amount);
          }
        });
      }

      promise = promise.then(function() {
        dimStoreService.setHeights();
        var message;
        if (vm.store.isVault) {
          message = 'All ' + vm.item.name + ' is now in your vault.';
        } else {
          message = 'All ' + vm.item.name + ' is now on your ' + vm.store.name + ".";
        }
        toaster.pop('success', 'Consolidated ' + vm.item.name, message);
      })
      .catch(function(a) {
        toaster.pop('error', vm.item.name, a.message);
      });

      loadingTracker.addPromise(promise);
      $scope.$parent.closeThisDialog();
      return promise;
    });

    vm.distribute = dimActionQueue.wrap(function() {
      // Sort vault to the end
      var stores = _.sortBy(dimStoreService.getStores(), function(s) { return s.id == 'vault' ? 2 : 1; });

      var total = 0;
      var amounts = stores.map(function(store) {
        var amount = store.amountOfItem(vm.item);
        total += amount;
        return amount;
      });

      var numTargets = stores.length - 1; // exclude the vault
      var remainder = total % numTargets;
      var targets = stores.map(function(store, index) {
        if (index >= numTargets) {
          return 0; // don't want any in the vault
        }
        var result;
        if (remainder > 0) {
          result = Math.ceil(total / numTargets);
        } else {
          result = Math.floor(total / numTargets);
        }
        remainder--;
        return result;
      });
      var deltas = _.zip(amounts, targets).map(function(pair) {
        return pair[1] - pair[0];
      });

      var vaultMoves = [];
      var targetMoves = [];
      var vaultIndex = stores.length - 1;
      var vault = stores[vaultIndex];

      deltas.forEach(function(delta, index) {
        if (delta < 0 && index !== vaultIndex) {
          vaultMoves.push({
            source: stores[index],
            target: vault,
            amount: -delta
          });
        } else if (delta > 0) {
          targetMoves.push({
            source: vault,
            target: stores[index],
            amount: delta
          });
        }
      });

      // All moves to vault in parallel, then all moves to targets in parallel
      function applyMoves(moves) {
        return $q.all(moves.map(function(move) {
          var item = _.find(move.source.items, function(i) {
            return i.hash === vm.item.hash;
          });
          return dimItemService.moveTo(item, move.target, false, move.amount);
        }));
      };

      var promise = applyMoves(vaultMoves)
            .then(function() {
              return applyMoves(targetMoves);
            });

      promise = promise.then(function() {
        dimStoreService.setHeights();
        toaster.pop('success', 'Distributed ' + vm.item.name, vm.item.name + ' is now equally divided between characters.');
      })
      .catch(function(a) {
        toaster.pop('error', vm.item.name, a.message);
      });

      loadingTracker.addPromise(promise);
      $scope.$parent.closeThisDialog();
      return promise;
    });

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
  }
})();
