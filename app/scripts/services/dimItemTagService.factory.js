(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimItemTagService', ItemTagService);

  ItemTagService.$inject = ['dimPlatformService', 'SyncService', 'dimStoreService', '$q'];

  function ItemTagService(dimPlatformService, SyncService, dimStoreService, $q) {
    var key;

    function getKey() {
      if(key) {
        return key;
      }
      var platform = dimPlatformService.getActive();
      key = 'taggedItems-' + (platform ? platform.type : '');
      return key;
    }

    function cleanTags() {
      if(!key) {
        return;
      }
      let accountItems = [];
      $q.when(dimStoreService.getStores()).then((stores) => {
        _.each(stores, (store) => {
          accountItems = accountItems.concat(store.items);
        });

        SyncService.get().then(function(data) {
          var ret = {};
          ret[getKey()] = {};

          data = data[getKey()] || {};

          for (var id in data) {
            if (data[id].type && _.some(accountItems, function(accountItem) {
              return accountItem.id === id;
            })) {
              ret[getKey()][id] = data[id];
            }
          }
          SyncService.set(ret);
        });
      });
    }

    return {
      getKey: getKey,
      cleanTags: cleanTags
    };
  }
})();
