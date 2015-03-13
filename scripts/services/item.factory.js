(function () {
  'use strict';

  angular.module('dimApp')
    .factory('dimItemService', ItemService);

  ItemService.$inject = ['dimStoreService', 'dimBungieService', 'dimConfig'];

  function ItemService(dimStoreService, dimBungieService, dimConfig) {
    return {
      getItem: getItem,
      getItems: getItems,
      moveTo: moveTo
    };

    function moveTo(item, store) {
      var movePromise = null;

      if (item.owner === 'vault' && store.id === 'vault') {
        return $q(function(resolve, reject) {
          reject('vault to vault transfer.');
        });
      }

      if (store.id === 'vault' || item.owner === 'vault') {
        movePromise = dimBungieService.vault((item.owner === 'vault' ? store.id : item.owner), dimConfig.active.type, item.id, item.hash, 1, ((item.owner === 'vault') ? false : true))
          .then(function(data) {
            item.owner = store.id;
          });
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
