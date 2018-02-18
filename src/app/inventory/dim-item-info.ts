import { extend } from 'angular';
import * as _ from 'underscore';
import { reportException } from '../exceptions';
import { SyncService } from '../storage/sync.service';

import { toaster } from '../ngimport-more';
import { t } from 'i18next';
import { DimStore } from './store/d2-store-factory.service';
import { DimItem } from './store/d2-item-factory.service';

/**
 * Extra DIM-specific info, stored per item.
 */
export interface DimItemInfo {
  tag?: 'favorite' | 'keep' | 'junk' | 'infuse';
  notes?: string;
  save?(): void;
}

/**
 * An account-specific source of item info objects, keyed off instanceId.
 */
export class ItemInfoSource {
  constructor(
    readonly key: string,
    readonly infos: { [itemInstanceId: string]: DimItemInfo }
  ) {}

  infoForItem(hash: number, id: string): DimItemInfo {
    const itemKey = `${hash}-${id}`;
    const info = this.infos[itemKey];
    const accountKey = this.key;
    return extend({
      save() {
        return getInfos(accountKey).then((infos) => {
          infos[itemKey] = _.omit(this, 'save');
          if (_.isEmpty(infos[itemKey])) {
            delete infos[itemKey];
          }
          setInfos(accountKey, infos)
            .catch((e) => {
              toaster.pop('error',
                t('ItemInfoService.SaveInfoErrorTitle'),
                t('ItemInfoService.SaveInfoErrorDescription', { error: e.message }));
              console.error("Error saving item info (tags, notes):", e);
              reportException('itemInfo', e);
            });
        });
      }
    }, info);
  }

  // Remove all item info that isn't in stores' items
  cleanInfos(stores: DimStore[]) {
    if (!stores.length) {
      // don't accidentally wipe out notes
      return Promise.resolve();
    }

    return getInfos(this.key).then((infos) => {
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

      return setInfos(this.key, remain);
    });
  }

  /** bulk save a list of items to storage */
  bulkSave(items: DimItem[]) {
    return getInfos(this.key).then((infos) => {
      items.forEach((item) => {
        infos[`${item.hash}-${item.id}`] = { tag: item.dimInfo.tag };
      });
      return setInfos(this.key, infos);
    });
  }
}

/**
 * The item info source maintains a map of extra, DIM-specific, synced data about items (per platform).
 * These info objects have a save method on them that can be used to persist any changes to their properties.
 */
export function getItemInfoSource(account): Promise<ItemInfoSource> {
  const key = `dimItemInfo-m${account.membershipId}-p${account.platformType}-d${account.destinyVersion}`;

  return getInfos(key)
    .then((infos) => new ItemInfoSource(key, infos));
}

function getInfos(key: string): Promise<{ [itemInstanceId: string]: DimItemInfo }> {
  return SyncService.get().then((data) => {
    return data[key] || {};
  });
}

/**
 * Save infos to the sync service.
 */
function setInfos(key: string, infos: { [itemInstanceId: string]: DimItemInfo }) {
  return SyncService.set({ [key]: infos });
}
