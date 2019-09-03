import _ from 'lodash';
import { reportException } from '../exceptions';
import { SyncService, DimData } from '../storage/sync.service';

import { t } from 'app/i18next-t';
import { DimStore } from './store-types';
import { DimItem } from './item-types';
import store from '../store/store';
import { setTagsAndNotes, setTagsAndNotesForItem } from './actions';
import { heartIcon, banIcon, tagIcon, boltIcon } from '../shell/icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { InventoryState } from './reducer';
import { showNotification } from '../notifications/notifications';
import { BungieMembershipType } from 'bungie-api-ts/user';

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
  // t('Tags.TagItem')
  // t('Tags.Favorite')
  // t('Tags.Keep')
  // t('Tags.Junk')
  // t('Tags.Infuse')
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

  async save() {
    let infos = await getInfos(this.accountKey);
    if (!this.tag && (!this.notes || this.notes.length === 0)) {
      const { [this.itemKey]: _, ...rest } = infos;
      infos = rest;
    } else {
      infos = {
        ...infos,
        [this.itemKey]: { tag: this.tag, notes: this.notes }
      };
    }
    store.dispatch(setTagsAndNotesForItem({ key: this.itemKey, info: infos[this.itemKey] }));
    try {
      await setInfos(this.accountKey, infos);
    } catch (e) {
      showNotification({
        type: 'error',
        title: t('ItemInfoService.SaveInfoErrorTitle'),
        body: t('ItemInfoService.SaveInfoErrorDescription', { error: e.message })
      });
      console.error('Error saving item info (tags, notes):', e);
      reportException('itemInfo', e);
    }
  }
}

/**
 * An account-specific source of item info objects, keyed off instanceId.
 */
export class ItemInfoSource {
  constructor(
    readonly key: string,
    readonly infos: Readonly<{ [itemInstanceId: string]: DimItemInfo }>
  ) {}

  infoForItem(item: DimItem): DimItemInfo {
    const info = this.infos[item.id];
    return new ItemInfo(item.id, this.key, info && info.tag, info && info.notes);
  }

  // Remove all item info that isn't in stores' items
  async cleanInfos(stores: DimStore[]) {
    if (!stores.length || stores.some((s) => s.items.length === 0)) {
      // don't accidentally wipe out notes
      return;
    }

    const infos = await getInfos(this.key);
    if (_.isEmpty(infos)) {
      return;
    }

    const remain = {};
    stores.forEach((store) => {
      store.items.forEach((item) => {
        const info = infos[item.id];
        if (info && (info.tag !== undefined || (info.notes && info.notes.length))) {
          remain[item.id] = info;
        }
      });
    });
    return setInfos(this.key, remain);
  }

  /** bulk save a list of keys directly to storage */
  async bulkSaveByKeys(keys: { key: string; tag?: TagValue; notes?: string }[]) {
    let infos = await getInfos(this.key);
    keys.forEach(({ key, tag, notes }) => {
      infos = {
        ...infos,
        [key]: { ...infos[key], tag, notes }
      };
      store.dispatch(setTagsAndNotesForItem({ key, info: infos[key] }));
    });
    return setInfos(this.key, infos);
  }
}

/**
 * The item info source maintains a map of extra, DIM-specific, synced data about items (per platform).
 * These info objects have a save method on them that can be used to persist any changes to their properties.
 */
export async function getItemInfoSource(account: DestinyAccount): Promise<ItemInfoSource> {
  const key = `dimItemInfo-m${account.membershipId}-d${account.destinyVersion}`;

  const data = await SyncService.get();

  let infos = data[key];
  if (!infos) {
    infos = await getOldInfos(key, account, data);
  }
  store.dispatch(setTagsAndNotes(infos));
  return new ItemInfoSource(key, infos);
}

/**
 * Load infos in the old way we used to save them.
 */
export async function getOldInfos(
  newKey: string,
  account: DestinyAccount,
  data: Readonly<DimData>
): Promise<Readonly<{ [itemInstanceId: string]: DimItemInfo }>> {
  let oldKey = `dimItemInfo-m${account.membershipId}-p${account.originalPlatformType}-d${account.destinyVersion}`;

  let infos = data[oldKey];
  if (!infos) {
    // Steam players may have originally been Blizzard players
    if (account.originalPlatformType === BungieMembershipType.TigerSteam) {
      oldKey = `dimItemInfo-m${account.membershipId}-p${BungieMembershipType.TigerBlizzard}-d${account.destinyVersion}`;
      infos = data[oldKey];
    }
  }

  if (infos) {
    // Convert to new format
    const newInfos = _.mapKeys(infos, (_, k) => k.split('-')[1]);
    await setInfos(newKey, newInfos);
    await SyncService.remove(oldKey);
    return newInfos;
  }

  return {};
}

async function getInfos(key: string): Promise<Readonly<{ [itemInstanceId: string]: DimItemInfo }>> {
  const data = await SyncService.get();
  return data[key] || {};
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
  return itemInfos[item.id] && itemInfos[item.id].tag;
}

export function getNotes(
  item: DimItem,
  itemInfos: InventoryState['itemInfos']
): string | undefined {
  return itemInfos[item.id] && itemInfos[item.id].notes;
}
