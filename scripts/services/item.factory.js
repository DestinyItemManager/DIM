/*jshint -W027*/

(function () {
  'use strict';

  angular.module('dimApp')
    .factory('dimItemService', ItemService);

  ItemService.$inject = ['dimStoreService', 'dimBungieService', 'dimConfig', 'dimItemTier', 'dimCategory', '$q'];

  function ItemService(dimStoreService, dimBungieService, dimConfig, dimItemTier, dimCategory, $q) {
    return {
      getItem: getItem,
      getItems: getItems,
      moveTo: moveTo
    };

    function equipItem(item) {
      return $q(function (resolve, reject) {
        if (dimConfig.debug) {
          console.log('Equipping Item: i:' + item.id + ' o:' + item.owner);
        }

        resolve();
      });
    }

    function dequipItem(item, equipExotic) {
      if (_.isUndefined(equipExotic)) {
        equipExotic = false;
      }

      return $q(function (resolve, reject) {
        if (dimConfig.debug) {
          console.log('Dequipping Item: i:' + item.id + ' s:' + item.owner);
        }

        resolve();
      });
    }

    function moveToVault(item) {
      var moveToStorePreBake = moveToStore.bind(null, item, dimStoreService.getStore('vault'));
      return $q.when()
        .then(moveToStorePreBake);
    }

    function moveToStore(item, store) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      deferred.resolve();

      return promise
        .then(function (result) {
          if (dimConfig.debug) {
            console.log('Moving Item to Store: i:' + item.id + ' s:' + store.id);
          }
        });
    }

    function canEquipExotic(item, store) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      var prefix = _(store.items)
        .chain()
        .filter(function (i) {
          return (i.equipped && i.type !== item.type && i.tier === dimItemTier.exotic)
        });

      var category = 'Apples';

      if (prefix.size()
        .value() === 0) {
        deferred.resolve(true);
      } else {
        deferred.reject('An exotic item is already equipped in the \'' + category + '\' slot.');
      }

      return promise;
    }

    function checkItemCount(store, category) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      if (_(store.items)
        .chain()
        .where({
          type: category
        })
        .size()
        .value() < 10) {
        deferred.resolve(true);
      } else {
        deferred.reject('There are too many items in the category \'' + category + '\'');
      }

      return promise;
    }

    function canMoveToStore(item, store) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      var checkItemCountPrebake = checkItemCount.bind(null, store, item.type);

      deferred.resolve();

      return promise
        .then(checkItemCountPrebake);
    }

    function isVaultToVault(item, store) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      var result = ((item.owner === 'vault') && (store.id === 'vault'));

      deferred.resolve(result ? deferred.reject('Cannot process vault-to-vault transfers.') : false);

      return promise;
    }


    function isValidTransfer(item, store, equip) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      if (dimConfig.debug) {
        console.log('Valid Transfer: i:' + item.id + ' o:' + item.owner + ' s:' + store.id);
      }

      var isVaultToVaultPrebake = isVaultToVault.bind(null, item, store);
      var canMoveToStorePrebake = canMoveToStore.bind(null, item, store);
      var canEquipExoticPrebake = canEquipExotic.bind(null, item, store);

      deferred.resolve();

      return promise
        .then(isVaultToVaultPrebake)
        .then(canMoveToStorePrebake)
        .then(canEquipExoticPrebake);
    }

    function moveTo(item, store, equip) {
      var a = dimCategory;
      // Prebaking function calls with .bind()
      // var checkForVaultToVault = isVaultToVaultTransfer.bind(null, item, store);

      // If there is no eqiup flag, we will assume that it will not be equipped,
      // unless you are performing a move on an item and the target it the same
      // store that the item is associated.
      if (_.isUndefined(equip)) {
        equip = (item.owner === store.id) ? !item.equipped : false;
      }

      var meta = {
        'item': {
          'owner': item.owner,
          'inVault': item.owner === 'vault'
        },
        'store': {
          'isVault': store.id === 'vault',
          'isGuardian': store.id !== 'vault'
        }
      };

      var promise = $q.when()
        .then(isValidTransfer.bind(null, item, store, equip));

      if (meta.item.inVault && meta.store.isGuardian) {
        promise = promise
          .then(moveToStore.bind(null, item, store));

        if (equip) {
          promise = promise
            .then(equipItem.bind(null, item));
        }
      } else if (!meta.item.inVault) {
        if (item.owner !== store.id) {
          if (item.equipped) {
            promise = promise
              .then(dequipItem.bind(null, item))
              .then(moveToVault.bind(null, item));
          }

          if (meta.store.isGuardian) {
            promise = promise
              .then(moveToStore.bind(null, item, store));

            if (equip) {
              promise = promise
                .then(equipItem.bind(null, item));
            }
          }
        } else {
          if (item.equipped) {
            promise = promise
              .then(dequipItem.bind(null, item));
          } else {
            promise = promise
              .then(equipItem.bind(null, item));
          }
        }
      }

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
