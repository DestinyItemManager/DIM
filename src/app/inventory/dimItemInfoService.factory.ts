import { extend } from 'angular';
import * as _ from 'underscore';
import { reportException } from '../exceptions';
import { SyncService } from '../storage/sync.service';

/**
 * The item info service maintains a map of extra, DIM-specific, synced data about items (per platform).
 * These info objects have a save method on them that can be used to persist any changes to their properties.
 */
export function ItemInfoService($i18next, toaster, $q) {
  'ngInject';

  function getInfos(key) {
    return SyncService.get().then((data) => {
      return data[key] || {};
    });
  }

  /**
   * Save infos to the sync service.
   */
  function setInfos(key, infos) {
    return SyncService.set({ [key]: infos });
  }

  // Returns a function that, when given an account, returns the item info source for that platform
  return (account, destinyVersion = 1) => {
    const key = `dimItemInfo-m${account.membershipId}-p${account.platformType}-d${destinyVersion}`;

    return getInfos(key)
      .then((infos) => {
        return {
          infoForItem(hash, id) {
            const itemKey = `${hash}-${id}`;
            const info = infos[itemKey];
            return extend({
              save() {
                return getInfos(key).then((infos) => {
                  infos[itemKey] = _.omit(this, 'save');
                  setInfos(key, infos)
                    .catch((e) => {
                      toaster.pop('error',
                        $i18next.t('ItemInfoService.SaveInfoErrorTitle'),
                        $i18next.t('ItemInfoService.SaveInfoErrorDescription', { error: e.message }));
                      console.error("Error saving item info (tags, notes):", e);
                      reportException('itemInfo', e);
                    });
                });
              }
            }, info);
          },

          // Remove all item info that isn't in stores' items
          cleanInfos(stores) {
            if (!stores.length) {
              // don't accidentally wipe out notes
              return $q.when();
            }

            return getInfos(key).then((infos) => {
              const remain = {};

              stores.forEach((store) => {
                store.items.forEach((item) => {
                  const itemKey = `${item.hash}-${item.id}`;
                  const info = infos[itemKey];
                  if (info && (info.tag !== undefined || (info.notes && info.notes.length))) {
                    remain[itemKey] = info;
                  }
                });
              });

              return setInfos(key, remain);
            });
          },

          // bulk save a list of items to storage
          bulkSave(items) {
            return getInfos(key).then((infos) => {
              items.forEach((item) => {
                infos[`${item.hash}-${item.id}`] = { tag: item.dimInfo.tag };
              });
              return setInfos(key, infos);
            });
          }
        };
      });
  };
}
