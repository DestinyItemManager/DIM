import { ItemAnnotation, ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { tl } from 'app/i18next-t';
import { RootState, ThunkResult } from 'app/store/types';
import _ from 'lodash';
import { archiveIcon, banIcon, boltIcon, heartIcon, tagIcon } from '../shell/icons';
import { tagCleanup } from './actions';
import { DimItem } from './item-types';
import { itemHashTagsSelector, itemInfosSelector } from './selectors';
import { DimStore } from './store-types';

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
  junk: {
    type: 'junk' as const,
    label: tl('Tags.Junk'),
    sortOrder: 2,
    hotkey: 'shift+3',
    icon: banIcon,
  },
  infuse: {
    type: 'infuse' as const,
    label: tl('Tags.Infuse'),
    sortOrder: 3,
    hotkey: 'shift+4',
    icon: boltIcon,
  },
  archive: {
    type: 'archive' as const,
    label: tl('Tags.Archive'),
    sortOrder: 4,
    hotkey: 'shift+5',
    icon: archiveIcon,
  },
};

export type TagValue = keyof typeof tagConfig;
export type TagCommand = TagValue | 'clear';

const tagCommandStrings = [...Object.keys(tagConfig), 'clear'];

/**
 * Helper function to check if a string is TagValue type and declare it as one.
 */
export function isTagCommand(value: string): value is TagCommand {
  return tagCommandStrings.includes(value);
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

export interface ItemInfos {
  [itemId: string]: ItemAnnotation;
}

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

export const itemTagSelectorList: TagInfo[] = [
  { label: tl('Tags.TagItem') },
  ...Object.values(tagConfig),
];

/**
 * Delete items from the loaded items that don't appear in newly-loaded stores
 */
export function cleanInfos(stores: DimStore[]): ThunkResult {
  return async (dispatch, getState) => {
    if (!stores.length || stores.some((s) => s.items.length === 0 || s.hadErrors)) {
      // don't accidentally wipe out notes
      return;
    }

    const infos = itemInfosSelector(getState());

    if (_.isEmpty(infos)) {
      return;
    }

    // Tags/notes are stored keyed by instance ID. Start with all the keys of the
    // existing tags and notes and remove the ones that are still here, and the rest
    // should be cleaned up because they refer to deleted items.
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
    ? (item.instanced ? itemInfos[item.id]?.tag : itemHashTags?.[item.hash]?.tag) || undefined
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
    ? (item.instanced ? itemInfos[item.id]?.notes : itemHashTags?.[item.hash]?.notes) || undefined
    : undefined;
}

/** given an item, returns a selector which monitors that item's notes */
export const itemNoteSelector =
  (item: DimItem) =>
  (state: RootState): string | undefined =>
    getNotes(item, itemInfosSelector(state), itemHashTagsSelector(state));
