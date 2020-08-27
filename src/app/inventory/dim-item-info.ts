import _ from 'lodash';

import { DimStore } from './store-types';
import { DimItem } from './item-types';
import { tagCleanup } from './actions';
import { heartIcon, banIcon, tagIcon, boltIcon, archiveIcon } from '../shell/icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ThunkResult } from 'app/store/types';
import { itemInfosSelector } from './selectors';
import { ItemAnnotation, ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { itemIsInstanced } from 'app/utils/item-utils';
import { tl } from 'app/i18next-t';

// sortOrder: orders items within a bucket, ascending
export const tagConfig = {
  favorite: {
    type: 'favorite' as const,
    label: tl('Tags.Favorite'),
    sortOrder: 0,
    hotkey: 'shift+1',
    icon: heartIcon,
  },
  keep: {
    type: 'keep' as const,
    label: tl('Tags.Keep'),
    sortOrder: 1,
    hotkey: 'shift+2',
    icon: tagIcon,
  },
  infuse: {
    type: 'infuse' as const,
    label: tl('Tags.Infuse'),
    sortOrder: 2,
    hotkey: 'shift+4',
    icon: boltIcon,
  },
  junk: {
    type: 'junk' as const,
    label: tl('Tags.Junk'),
    sortOrder: 3,
    hotkey: 'shift+3',
    icon: banIcon,
  },
  archive: {
    type: 'archive' as const,
    label: tl('Tags.Archive'),
    sortOrder: 4,
    hotkey: 'shift+5',
    icon: archiveIcon,
  },
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
  'favorite',
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
  'archive',
];

export type ItemInfos = { [itemId: string]: ItemAnnotation };

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
  { label: tl('Tags.TagItem') },
  ...Object.values(tagConfig),
];

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

export function getTag(
  item: DimItem,
  itemInfos: ItemInfos,
  itemHashTags?: {
    [itemHash: string]: ItemHashTag;
  }
): TagValue | undefined {
  return item.taggable
    ? (itemIsInstanced(item) ? itemInfos[item.id]?.tag : itemHashTags?.[item.hash]?.tag) ||
        undefined
    : undefined;
}

export function getNotes(
  item: DimItem,
  itemInfos: ItemInfos,
  itemHashTags?: {
    [itemHash: string]: ItemHashTag;
  }
): string | undefined {
  return item.taggable
    ? (itemIsInstanced(item) ? itemInfos[item.id]?.notes : itemHashTags?.[item.hash]?.notes) ||
        undefined
    : undefined;
}
