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
        '<div class="move-popup">',
        '  <div dim-move-item-properties="vm.item"></div>',
        '  <div class="locations" ng-repeat="store in vm.stores">',
        '    <div class="move-button move-vault" ng-class="{ \'little\': item.notransfer }" ',
        '      ng-if="vm.canShowVault(vm.item, vm.store, store)" ng-click="vm.moveToVault(store, $event)" ',
        '      data-type="item" data-character="{{ store.id }}">',
        '      <span>Vault</span>',
        '    </div>',
        '    <div class="move-button move-store" ng-class="{ \'little\': item.notransfer }" ',
        '      ng-if="vm.canShowStore(vm.item, vm.store, store)" ng-click="vm.moveToGuardian(store, $event)" ',
        '      data-type="item" data-character="{{ store.id }}" style="background-image: url(http://bungie.net{{ store.icon }})"> ',
        '      <span>Store</span>',
        '    </div>',
        '    <div class="move-button move-equip" ng-class="{ \'little\': item.notransfer }" ',
        '      ng-if="vm.canShowEquip(vm.item, vm.store, store)" ng-click="vm.moveToEquip(store, $event)" ',
        '      data-type="equip" data-character="{{ store.id }}" style="background-image: url(http://bungie.net{{ store.icon }})">',
        '      <span>Equip</span>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  MovePopupController.$inject = ['dimStoreService', 'dimItemService', 'ngDialog', '$q', 'toaster'];

  function MovePopupController(dimStoreService, dimItemService, ngDialog, $q, toaster) {
    var vm = this;

    function moveToVaultFn(store, e) {
      // var promise = $q.when(vm.item);
      //
      // if (vm.item.equipped) {
      //   var item = vm.getSimilarItem(vm.item);
      //
      //   if (item) {
      //
      //   } else {
      //     // Can't find item to replace.
      //   }
      //   // get comparable item
      //   // equip comparable item
      // } else {
      dimItemService.moveTo(vm.item, store)
        .catch(function(a) {
          toaster.pop('error', vm.item.name, a.message);
        });
      // .then(moveItemUI.bind(null, vm.item, store));
      // }



      // if (store.id !== 'vault') {
      //   // move to vault
      // }

      // var current = _.find(vm.store.items, function (item) {
      //   return ((item.type === vm.item.type) && (vm.item.sort === item.sort) && item.equipped);
      // });
      //
      // var i = _.indexOf(vm.store.items, vm.item);
      //
      // if (i >= 0) {
      //   vm.store.items.splice(i, 1);
      //   store.items.push(vm.item);
      //   vm.item.owner = store.id;
      //   vm.item.equipped = true;
      // }
      //
      // i = _.indexOf(vm.store.items, current);
      //
      // if (i >= 0) {
      //   vm.store.items.splice(i, 1);
      //   store.items.push(current);
      //   current.owner = store.id;
      //   current.equipped = false;
      // }
    }

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
      dimItemService.moveTo(vm.item, store)
      .catch(function(a) {
        toaster.pop('error', vm.item.name, a.message);
      });
      // if (vm.item.equipped) {
      //   var item = vm.getSimilarItem(vm.item)
      //     .then(function(item) {
      //       vm.item.equipped = false;
      //       moveItemUI(vm.item, store);
      //       moveItemUI(item, vm.store);
      //       item.equipped = true;
      //     });
      // }
      //
      // if ((vm.item.owner !== store.id) && (store.id !== 'vault')) {
      //   // move to vault
      // }
      //
      // if (vm.item.owner === 'vault') {
      //   // Move to store
      // }
    }

    function moveToEquipFn(store, e) {
      dimItemService.moveTo(vm.item, store, true)
        .catch(function(a) {
          toaster.pop('error', vm.item.name, a.message);
        });
      // if (vm.item.equipped && (vm.item.owner !== store.id)) {
      //   var item = vm.getSimilarItem(vm.item)
      //     .then(function(item) {
      //       moveItemUI(vm.item, store);
      //       moveItemUI(item, vm.store);
      //       item.equipped = vm.item.equipped;
      //       vm.item.equipped = true;
      //     });
      //   // get comparable item
      //   // equip comparable item
      // }
      //
      // if ((vm.item.owner !== store.id) && (store.id !== 'vault')) {
      //   // move to vault
      // }
      //
      // if (vm.item.owner === 'vault') {
      //   // Move to store
      // }

      // equip item
    }

    function getSimilarItemFn(item) {
      return dimStoreService.getStore(item.owner)
        .then(function(store) {
          var result = null;
          var stores = _.sortBy(vm.stores, function(s) {
            if (store.id === s.id) {
              return 0;
            } else if (s.id === 'vault') {
              return 1;
            } else {
              return 2;
            }
          });

          _.each(stores, function(s) {
            if (_.isNull(result)) {
              result = getItemFn(item, s);
            }
          });

          return result;
        });
    }

    function getItemFn(fnItem, fnStore) {
      var result = null;
      var sortType = {
        Legendary: 0,
        Rare: 1,
        Uncommon: 2,
        Common: 3,
        Basic: 4,
        Exotic: 5
      };

      var results = _.chain(fnStore.items)
        .where({
          classType: fnItem.classType
        })
        .sortBy(function(i) {
          return sortType[i.tier];
        })
        .where({
          type: fnItem.type
        })
        .value();

      if (_.size(results) > 0) {
        result = results[0];

        if ((result.id === fnItem.id) && (result.hash === fnItem.hash)) {
          if (_.size(results) > 1) {
            result = results[1];
          } else {
            result = null;
          }
        }
      }

      return result;
    }

    vm.moveToVault = moveToVaultFn;
    vm.moveToEquip = moveToEquipFn;
    vm.moveToGuardian = moveToGuardianFn;
    vm.getSimilarItem = getSimilarItemFn;

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

      if (!item.notransfer) {
        if (itemStore.id !== buttonStore.id) {
          return true;
        } else if (!item.equipped) {
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
