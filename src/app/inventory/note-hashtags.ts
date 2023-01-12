import { uniqBy } from 'app/utils/util';
import { ItemInfos } from './dim-item-info';

/**
 * collects all hashtags from item notes
 */
export function collectNotesHashtags(itemInfos: ItemInfos) {
  const hashTags = new Set<string>();
  for (const info of Object.values(itemInfos)) {
    const matches = getHashtagsFromNote(info.notes);
    if (matches) {
      for (const match of matches) {
        hashTags.add(match);
      }
    }
  }
  return uniqBy(hashTags, (t) => t.toLowerCase());
}

export function getHashtagsFromNote(note?: string | null) {
  return Array.from(note?.matchAll(/#[\w\uE000-\uF8FF]+/g) ?? [], (m) => m[0]);
}
