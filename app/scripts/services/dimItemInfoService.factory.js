(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimItemInfoService', ItemInfoService);

  ItemInfoService.$inject = ['dimPlatformService', 'SyncService'];

  /**
   * The item info service maintains a map of extra, DIM-specific, synced data about items (per platform).
   * These info objects have a save method on them that can be used to persist any changes to their properties.
   */
  function ItemInfoService(dimPlatformService, SyncService) {
    // Returns a function that, when given a platform, returns the item info source for that platform
    return function(platform) {
      return SyncService.get().then(function(data) {
        const key = 'dimItemInfo-' + platform.type;
        const infos = data[key] || {};

        return {
          infoForItem: function(hash, id) {
            const itemKey = hash + '-' + id;
            const info = infos[itemKey];
            return angular.extend({
              save: function() {
                return SyncService.get().then((data) => {
                  const infos = data[key];
                  infos[itemKey] = _.omit(this, 'save');
                  SyncService.set({ [key]: infos });
                });
              }
            }, info);
          },

          // Remove all item info that isn't in stores' items
          cleanInfos: function(stores) {
            if (!stores.length) {
              // don't accidentally wipe out notes
              return;
            }

            SyncService.get().then(function(data) {
              const remain = {};
              const infos = data[key] || {};

              stores.forEach((store) => {
                store.items.forEach((item) => {
                  const itemKey = item.hash + '-' + item.id;
                  const info = infos[itemKey];
                  if (info && (info.tag !== undefined || (info.notes && info.notes.length))) {
                    remain[itemKey] = info;
                  }
                });
              });

              SyncService.set({ [key]: remain });
            });
          }
        };
      });
    };
  }
})();

