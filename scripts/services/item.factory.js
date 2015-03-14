/*jshint -W027*/

(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimItemService', ItemService);

  ItemService.$inject = ['dimStoreService', 'dimBungieService', 'dimConfig', 'dimItemTier', 'dimCategory'];

  function ItemService(dimStoreService, dimBungieService, dimConfig, dimItemTier, dimCategory) {
    return {
      getItem: getItem,
      getItems: getItems,
      moveTo: moveTo
    };

    function moveTo(item, store, equip) {
      var meta = {
        'item': {
          'owner': item.owner,
          'inVault': item.owner === 'vault'
        },
        'store': {
          'inVault': store.id === 'vault'
        }
      };

      if (meta.item.inVault && meta.store.inVault) {
        return $q.reject({
          'errorCode': 2,
          'message': 'Vault-to-vault transfer.'
        });
      }

      // If the item is in the vault, move it to the store.
      if (meta.item.inVault) {
        if (item.tier === dimItemTier.exotic) {
          // Better check to see if we can equip a legendary.

          // What types do we need to search?
          var category = _.chain(dimCategory)
            .pairs()
            .find(function(cat) {
              return _.some(cat[1],
                function(type) {
                  return (item.type == type);
                }
              );
            })
            .value();

          // Do any of these types have an exotic equipped?
          var exoticEquipped = _.some(category[1], function(type) {
              return store.hasExotic(type, true);
            });

            debugger;
        }
        return (dimBungieService.vault(store.id, dimConfig.active.type, item.id, item.hash, 1, false)
          .then(function(data) {
            // Change the owner of the item to the store.
            item.owner = store.id;
          }));
      }

      if (itemInVault || storeIsVault) {
        var characterId = (itemInVault) ? store.id : item.owner;
        var moveToVault = (itemInVault) ? false : true;

        return (dimBungieService.vault(characterId, dimConfig.active.type, item.id, item.hash, 1, moveToVault)
          .then(function(data) {
            item.owner = store.id;
          }));
      } else {
        if (item.owner === store.id) {
          // Equip or Dequip
          movePromise = dimBungieService.equip(dimConfig.active.type, store.id, item.id);
          movePromise.then(function(data) {
            item.equipped = !item.equipped;
          });
        } else {
          var destinationStore = store.id;
          var dequipPromise = null;
          var vaultPromise = null;

          // Dequip
          if (item.equipped) {
            dequipPromise = dimBungieService.equip(dimConfig.active.type, item.owner, item.id)
              .then(function(data) {
                item.equipped = false;
              });
          }

          var vault = dimStoreService.getStore('vault');
          vaultPromise = moveTo(item, vault) // Vault
            .then(function(data) {
              return moveTo(item, store); // Unvault
            });

          if (dequipPromise) {
            dequipPromise.then(function(data) {
              return vaultPromise;
            });

            movePromise = dequipPromise;
          } else {
            movePromise = vaultPromise;
          }
        }
      }

      return movePromise;
    }

    function getItems() {
      var returnValue = [];
      var stores = dimStoreService.getStores();

      angular.forEach(stores, function(store) {
        returnValue = returnValue.concat(store.items);
      });

      return returnValue;
    }

    function getItem(id) {
      var items = getItems();

      var item = _.find(items, function(item) {
        return item.id === id;
      });

      return item;
    }

    return service;
  }
})();
