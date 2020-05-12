import _ from 'lodash';
import { SyncService, DimData } from '../storage/sync.service';

import { DimStore } from './store-types';
import { DimItem } from './item-types';
import { tagCleanup, tagsAndNotesLoaded } from './actions';
import { heartIcon, banIcon, tagIcon, boltIcon, archiveIcon } from '../shell/icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { DestinyAccount } from '../accounts/destiny-account';
import { InventoryState } from './reducer';
import { BungieMembershipType } from 'bungie-api-ts/user';
import { ThunkResult } from 'app/store/reducers';
import { itemInfosSelector } from './selectors';

// sortOrder: orders items within a bucket, ascending
// these exist in comments so i18n       t('Tags.Favorite') t('Tags.Keep') t('Tags.Infuse')
// doesn't delete the translations       t('Tags.Junk') t('Tags.Archive') t('Tags.TagItem')
export const tagConfig = {
  favorite: {
    type: 'favorite' as const,
    label: 'Tags.Favorite',
    sortOrder: 0,
    hotkey: 'shift+1',
    icon: heartIcon
  },
  keep: {
    type: 'keep' as const,
    label: 'Tags.Keep',
    sortOrder: 1,
    hotkey: 'shift+2',
    icon: tagIcon
  },
  infuse: {
    type: 'infuse' as const,
    label: 'Tags.Infuse',
    sortOrder: 2,
    hotkey: 'shift+4',
    icon: boltIcon
  },
  junk: {
    type: 'junk' as const,
    label: 'Tags.Junk',
    sortOrder: 3,
    hotkey: 'shift+3',
    icon: banIcon
  },
  archive: {
    type: 'archive' as const,
    label: 'Tags.Archive',
    sortOrder: 4,
    hotkey: 'shift+5',
    icon: archiveIcon
  }
};

export type TagValue = keyof typeof tagConfig | 'clear' | 'lock' | 'unlock';

const tagValueStrings = [...Object.keys(tagConfig), 'clear', 'lock', 'unlock'];

/**
 * Helper function to check if a string is TagValue type and declare it as one.
 */
export function isTagValue(value: string): value is TagValue {
  return tagValueStrings.includes(value);
}

/**
 * Priority order for which items should get moved off a character (into the vault or another character)
 * when the character is full and you want to move something new in. Tag values earlier in this list
 * are more likely to be moved.
 */
export const characterDisplacePriority: (TagValue | 'none')[] = [
  // Archived items should move to the vault
  'archive',
  // Infusion fuel belongs in the vault
  'infuse',
  'none',
  'junk',
  'keep',
  // Favorites you probably want to keep on your character
  'favorite'
];

/**
 * Priority order for which items should get moved out of the vault (onto a character)
 * when the vault is full and you want to move something new in. Tag values earlier in this list
 * are more likely to be moved.
 */
export const vaultDisplacePriority: (TagValue | 'none')[] = [
  // Junk should probably bubble towards the character so you remember to delete them!
  'junk',
  'none',
  'keep',
  // Favorites you probably want to keep in the vault if you put them there
  'favorite',
  // Infusion fuel belongs in the vault
  'infuse',
  // Archived items should absolutely stay in the vault
  'archive'
];

/**
 * Extra DIM-specific info, stored per item.
 */
export interface DimItemInfo {
  tag?: TagValue;
  notes?: string;
}

export type ItemInfos = {
  [key: string]: {
    tag?: TagValue;
    notes?: string;
  };
};

export interface TagInfo {
  type?: TagValue;
  label: string;
  sortOrder?: number;
  displacePriority?: number;
  hotkey?: string;
  icon?: string | IconDefinition;
}

// populate tag list from tag config info
export const itemTagList: TagInfo[] = Object.values(tagConfig);
// t(Tags.TagItem) is the dropdown selector text hint for untagged things
export const itemTagSelectorList: TagInfo[] = [
  { label: 'Tags.TagItem' },
  ...Object.values(tagConfig)
];

/**
 * Load legacy (pre-DIM-Sync) item infos (tags and notes) into Redux from the sync service
 */
export function loadItemInfos(account: DestinyAccount): ThunkResult {
  return async (dispatch) => {
    const key = `dimItemInfo-m${account.membershipId}-d${account.destinyVersion}`;

    const data = await SyncService.get();

    let infos = data[key];
    if (!infos) {
      infos = await getOldInfos(account, data);
    }
    dispatch(tagsAndNotesLoaded(infos));
  };
}

/**
 * Delete items from the loaded items that don't appear in newly-loaded stores
 */
export function cleanInfos(stores: DimStore[]): ThunkResult {
  return async (dispatch, getState) => {
    if (!stores.length || stores.some((s) => s.items.length === 0)) {
      // don't accidentally wipe out notes
      return;
    }

    const infos = itemInfosSelector(getState());
    if (_.isEmpty(infos)) {
      return;
    }

    const cleanupIds = new Set(Object.keys(infos));
    for (const store of stores) {
      for (const item of store.items) {
        const info = infos[item.id];
        if (info && (info.tag !== undefined || info.notes?.length)) {
          cleanupIds.delete(item.id);
        }
      }
    }

    if (cleanupIds.size > 0) {
      dispatch(tagCleanup(Array.from(cleanupIds)));
    }
  };
}

/**
 * Load infos in the old way we used to save them.
 */
export async function getOldInfos(
  account: DestinyAccount,
  data: Readonly<DimData>
): Promise<Readonly<ItemInfos>> {
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
    ga('send', 'event', 'Item Tagging', 'Old Version');
    // Convert to new format
    const newInfos = _.mapKeys(infos, (_, k) => k.split('-')[1]);
    await SyncService.remove(oldKey);
    return newInfos;
  }

  return {};
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
