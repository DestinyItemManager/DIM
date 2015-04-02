(function () {
  'use strict';

  angular.module('dimApp')
    .factory('dimItemService', ItemService);

  ItemService.$inject = ['dimStoreService', 'dimBungieService', 'dimItemTier', 'dimCategory', '$q'];

  function ItemService(dimStoreService, dimBungieService, dimItemTier, dimCategory, $q) {
    return {
      getItem: getItem,
      getItems: getItems,
      moveTo: moveTo
    };

    function equipItem(item) {
      return $q(function (resolve, reject) {
        console.log('Equipping Item: i:' + item.id + ' o:' + item.owner);

        resolve();
      });
    }

    function dequipItem(item, equipExotic) {
      if (_.isUndefined(equipExotic)) {
        equipExotic = false;
      }

      return $q(function (resolve, reject) {
        console.log('Dequipping Item: i:' + item.id + ' s:' + item.owner);

        resolve();
      });
    }

    function moveToVault(item) {
      return moveToStore(item, dimStoreService.getStore('vault'));
    }

    function moveToStore(item, store) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      deferred.resolve();

      return promise;
    }

    function canEquipExotic(item, store) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      var prefix = _(store.items)
        .chain()
        .filter(function (i) {
          return (i.equipped && i.type !== item.type && i.sort === item.sort && i.tier === dimItemTier.exotic)
        });

      if (prefix.size()
        .value() === 0) {
        deferred.resolve(true);
      } else {
        deferred.reject('An exotic item is already equipped in the \'' + item.sort + '\' slot.');
      }

      return promise;
    }

    function canMoveToStore(item, store) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      var stackAmount = 0;
      var slotsNeededForTransfer = 0;

      var itemsInStore = _(store.items)
        .chain()
        .where({
          type: item.type
        })
        .size()
        .value();

      if (item.maxStackSize > 1) {
        stackAmount = _(store.items)
          .chain()
          .where({
            hash: item.hash
          })
          .pluck('amount')
          .reduce(function (memo, amount) {
            return memo + amount;
          }, 0)
          .value();

        slotsNeededForTransfer = Math.ceil((stackAmount + item.amount) / item.maxStackSize) - Math.ceil((stackAmount) / item.maxStackSize);
      }

      var typeQtyCap = 10;

      //TODO Hardcoded Item Quantity
      if (store.id === 'vault') {
        typeQtyCap = 20;
      } else {
        switch (item.type) {
        case 'Material':
        case 'Consumable':
          {
            typeQtyCap = 15;
            break;
          }
        default:
          {
            typeQtyCap = 10;
            break;
          }
        }
      }

      // TODO Need to add support to transfer partial stacks.
      if ((itemsInStore + slotsNeededForTransfer) < typeQtyCap) {
        deferred.resolve(true);
      } else {
        deferred.reject('There are too many items in the category \'' + (store.id === 'vault' ? item.sort : item.type) + '\'');
      }

      return promise;
    }

    function isVaultToVault(item, store) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      var result = ((item.owner === 'vault') && (store.id === 'vault'));

      deferred.resolve(result ? deferred.reject('Cannot process vault-to-vault transfers.') : false);

      return promise;
    }


    function isValidTransfer(item, store, equip) {
      return $q(function (resolve, reject) {
        var promises = [];

        promises.push(isVaultToVault(item, store));
        promises.push(canMoveToStore(item, store));

        if (item.tier === 'exotic') {
          promises.push(canEquipExotic(item, store));
        }

        resolve($q.all(promises));
      });
    }

    function moveTo(item, target, equip) {
      var a = dimCategory;
      // Prebaking function calls with .bind()
      // var checkForVaultToVault = isVaultToVaultTransfer.bind(null, item, target);

      // If there is no eqiup flag, we will assume that it will not be equipped,
      // unless you are performing a move on an item and the target it the same
      // store that the item is associated.
      if (_.isUndefined(equip)) {
        equip = (item.owner === target.id) ? !item.equipped : false;
      }

      var meta = {
        'item': {
          'owner': item.owner,
          'inVault': item.owner === 'vault'
        },
        'target': {
          'isVault': target.id === 'vault',
          'isGuardian': target.id !== 'vault'
        }
      };

      var promise = isValidTransfer(item, target, equip);

      // if (meta.item.inVault && meta.target.isGuardian) {
      //   promise = promise
      //     .then(moveToStore.bind(null, item, target));
      //
      //   if (equip) {
      //     promise = promise
      //       .then(equipItem.bind(null, item));
      //   }
      // } else if (!meta.item.inVault) {
      //   if (item.owner !== target.id) {
      //     if (item.equipped) {
      //       promise = promise
      //         .then(dequipItem.bind(null, item))
      //         .then(moveToVault.bind(null, item));
      //     }
      //
      //     if (meta.target.isGuardian) {
      //       promise = promise
      //         .then(moveToStore.bind(null, item, target));
      //
      //       if (equip) {
      //         promise = promise
      //           .then(equipItem.bind(null, item));
      //       }
      //     }
      //   } else {
      //     if (item.equipped) {
      //       promise = promise
      //         .then(dequipItem.bind(null, item));
      //     } else {
      //       promise = promise
      //         .then(equipItem.bind(null, item));
      //     }
      //   }
      // }

      return promise;
    }

    function getItems() {
      var returnValue = [];
      var stores = dimStoreService.getStores();

      angular.forEach(stores, function (store) {
        returnValue = returnValue.concat(store.items);
      });

      return returnValue;
    }

    function getItem(id) {
      var items = getItems();

      var item = _.find(items, function (item) {
        return item.id === id;
      });

      return item;
    }

    return service;
  }
})();
