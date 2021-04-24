import _ from 'lodash';
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
  return _.uniqBy([...hashTags], (t) => t.toLowerCase());
}

export function getHashtagsFromNote(note?: string | null) {
  return [...(note?.matchAll(/#\w+/g) ?? [])].map((m) => m[0]);
}
