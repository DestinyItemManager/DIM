import * as _ from 'lodash';
import { reportException } from '../exceptions';
import { SyncService } from '../storage/sync.service';

import { toaster } from '../ngimport-more';
import { t } from 'i18next';
import { DimStore } from './store-types';
import { DimItem } from './item-types';
import store from '../store/store';
import { setTagsAndNotes, setTagsAndNotesForItem } from './actions';
import { heartIcon, banIcon, tagIcon, boltIcon } from '../shell/icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { InventoryState } from './reducer';

export type TagValue = 'favorite' | 'keep' | 'junk' | 'infuse';

/**
 * Extra DIM-specific info, stored per item.
 */
export interface DimItemInfo {
  tag?: TagValue;
  notes?: string;
  save?(): void;
}

export interface TagInfo {
  type?: TagValue;
  label: string;
  hotkey?: string;
  icon?: IconDefinition;
}

// Predefined item tags. Maybe eventually allow to add more.
export const itemTags: TagInfo[] = [
  { label: 'Tags.TagItem' },
  { type: 'favorite', label: 'Tags.Favorite', hotkey: 'shift+1', icon: heartIcon },
  { type: 'keep', label: 'Tags.Keep', hotkey: 'shift+2', icon: tagIcon },
  { type: 'junk', label: 'Tags.Junk', hotkey: 'shift+3', icon: banIcon },
  { type: 'infuse', label: 'Tags.Infuse', hotkey: 'shift+4', icon: boltIcon }
];

class ItemInfo implements DimItemInfo {
  constructor(
    private itemKey: string,
    private accountKey: string,
    public tag?: TagValue,
    public notes?: string
  ) {}

  save() {
    return getInfos(this.accountKey).then((infos) => {
      if (!this.tag && (!this.notes || this.notes.length === 0)) {
        delete infos[this.itemKey];
      } else {
        infos[this.itemKey] = { tag: this.tag, notes: this.notes };
      }
      store.dispatch(setTagsAndNotesForItem({ key: this.itemKey, info: infos[this.itemKey] }));
      setInfos(this.accountKey, infos).catch((e) => {
        toaster.pop(
          'error',
          t('ItemInfoService.SaveInfoErrorTitle'),
          t('ItemInfoService.SaveInfoErrorDescription', { error: e.message })
        );
        console.error('Error saving item info (tags, notes):', e);
        reportException('itemInfo', e);
      });
    });
  }
}

/**
 * An account-specific source of item info objects, keyed off instanceId.
 */
export class ItemInfoSource {
  constructor(readonly key: string, readonly infos: { [itemInstanceId: string]: DimItemInfo }) {}

  infoForItem(hash: number, id: string): DimItemInfo {
    const itemKey = `${hash}-${id}`;
    const info = this.infos[itemKey];
    return new ItemInfo(itemKey, this.key, info && info.tag, info && info.notes);
  }

  // Remove all item info that isn't in stores' items
  cleanInfos(stores: DimStore[]) {
    if (!stores.length || stores.some((s) => s.items.length === 0)) {
      // don't accidentally wipe out notes
      return Promise.resolve();
    }

    return getInfos(this.key).then((infos) => {
      const remain = {};

      if (_.isEmpty(infos)) {
        return Promise.resolve();
      }

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
        const key = `${item.hash}-${item.id}`;
        infos[key] = { tag: item.dimInfo.tag };
        store.dispatch(setTagsAndNotesForItem({ key, info: infos[key] }));
      });
      return setInfos(this.key, infos);
    });
  }

  /** bulk save a list of keys directly to storage */
  bulkSaveByKeys(keys: { key: string; tag?: TagValue; notes?: string }[]) {
    return getInfos(this.key).then((infos) => {
      keys.forEach(({ key, tag, notes }) => {
        infos[key] = { tag, notes };
        store.dispatch(setTagsAndNotesForItem({ key, info: infos[key] }));
      });
      return setInfos(this.key, infos);
    });
  }
}

/**
 * The item info source maintains a map of extra, DIM-specific, synced data about items (per platform).
 * These info objects have a save method on them that can be used to persist any changes to their properties.
 */
export function getItemInfoSource(account: DestinyAccount): Promise<ItemInfoSource> {
  const key = `dimItemInfo-m${account.membershipId}-p${account.platformType}-d${
    account.destinyVersion
  }`;

  return getInfos(key).then((infos) => {
    store.dispatch(setTagsAndNotes(infos));
    return new ItemInfoSource(key, infos);
  });
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

export function getTag(
  item: DimItem,
  itemInfos: InventoryState['itemInfos']
): TagValue | undefined {
  const itemKey = `${item.hash}-${item.id}`;
  return itemInfos[itemKey] && itemInfos[itemKey].tag;
}

export function getNotes(
  item: DimItem,
  itemInfos: InventoryState['itemInfos']
): string | undefined {
  const itemKey = `${item.hash}-${item.id}`;
  return itemInfos[itemKey] && itemInfos[itemKey].notes;
}
