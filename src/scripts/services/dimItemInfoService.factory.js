import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .factory('dimItemInfoService', ItemInfoService);


/**
 * The item info service maintains a map of extra, DIM-specific, synced data about items (per platform).
 * These info objects have a save method on them that can be used to persist any changes to their properties.
 */
function ItemInfoService(dimPlatformService, SyncService, $translate, toaster, $q) {
  /**
   * Rebuild infos from partitioned info keys.
   */
  function getInfos(key) {
    return SyncService.get().then(function(data) {
      const infos = {};
      _.each(data, (v, k) => {
        if (k.startsWith(key)) {
          angular.extend(infos, v);
        }
      });
      return infos;
    });
  }

  /**
   * Save infos to the sync service as a partitioned set, with no more than
   * 50 items in a set. This help avoid bumping up against the 8k/key chrome sync
   * limit.
   */
  function setInfos(key, infos) {
    const partitions = {};
    let partition = {};
    let partitionCount = 0;
    let partitionSize = 0;
    _.each(infos, (v, k) => {
      partition[k] = v;
      partitionSize++;
      if (partitionSize >= 50) {
        partitions[key + '-p' + partitionCount] = partition;
        partition = {};
        partitionSize = 0;
        partitionCount++;
      }
    });
    partitions[key + '-p' + partitionCount] = partition;

    return SyncService.get().then(function(data) {
      const emptyPartitions = _.filter(
        _.keys(data), (k) => k.startsWith(key) && !partitions[k]);

      return SyncService
        .set(partitions)
        .then(() => {
          return SyncService.remove(emptyPartitions);
        });
    });
  }

  // Returns a function that, when given a platform, returns the item info source for that platform
  return function(platform) {
    const key = 'dimItemInfo-' + platform.type;
    return getInfos(key).then(function(infos) {
      return {
        infoForItem: function(hash, id) {
          const itemKey = hash + '-' + id;
          const info = infos[itemKey];
          return angular.extend({
            save: function() {
              return getInfos(key).then((infos) => {
                infos[itemKey] = _.omit(this, 'save');
                setInfos(key, infos)
                  .catch((e) => {
                    toaster.pop('error',
                                $translate.instant('ItemInfoService.SaveInfoErrorTitle'),
                                $translate.instant('ItemInfoService.SaveInfoErrorDescription', { error: e.message }));
                    console.error("Error saving item info (tags, notes):", e);
                  });
              });
            }
          }, info);
        },

        // Remove all item info that isn't in stores' items
        cleanInfos: function(stores) {
          if (!stores.length) {
            // don't accidentally wipe out notes
            return $q.when();
          }

          return getInfos(key).then(function(infos) {
            const remain = {};

            stores.forEach((store) => {
              store.items.forEach((item) => {
                const itemKey = item.hash + '-' + item.id;
                const info = infos[itemKey];
                if (info && (info.tag !== undefined || (info.notes && info.notes.length))) {
                  remain[itemKey] = info;
                }
              });
            });

            return setInfos(key, remain);
          });
        }
      };
    });
  };
}


