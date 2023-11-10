import { filterMap, uniqBy } from 'app/utils/collections';
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
  return uniqBy(hashTags, (t) => t.toLowerCase());
}

const hashtagRegex = /(?:^|[\s,])(#[\p{L}\p{N}_\p{Private_Use}\p{Other_Symbol}:-^#]+)/gu;

export function getHashtagsFromNote(note?: string | null) {
  return Array.from(note?.matchAll(hashtagRegex) ?? [], (m) => m[1]);
}

// TODO: am I really gonna need to write a parser again

/**
 * Add notes to an existing note. This is hashtag-aware, so it will not add a duplicate hashtag.
 */
export function appendedToNote(originalNote: string | undefined, append: string) {
  const originalSegmented = segmentHashtags(originalNote);
  const newSegmented = segmentHashtags(append);
  const existingHashtags = new Set(
    filterMap(originalSegmented, (s) => (typeof s !== 'string' ? s.hashtag : undefined)),
  );
  // Don't add hashtags that already exist again - remove them from the input
  const filteredAppendSegments = newSegmented.filter(
    (s) => typeof s === 'string' || !existingHashtags.has(s.hashtag),
  );
  return _.compact([...originalSegmented, ' ', ...filteredAppendSegments])
    .map((s) => (typeof s === 'string' ? s : s.hashtag))
    .join('')
    .replaceAll(/(\s)+/g, '$1')
    .trim();
}

const allHashtagsRegex = /^(\s*)((#[\p{L}\p{N}_\p{Private_Use}\p{Other_Symbol}:-]+)\s*)+$/u;

/**
 * Add notes to an existing note. This is hashtag-aware, so it will not remove
 * partial hashtags.
 */
export function removedFromNote(originalNote: string | undefined, removed: string) {
  if (!originalNote) {
    return undefined;
  }
  const originalSegmented = segmentHashtags(originalNote);
  // Treat it like a remove-hashtags operation and just remove all the named hashtags individually
  if (removed.match(allHashtagsRegex)) {
    const removeHashTags = new Set(getHashtagsFromNote(removed));

    return originalSegmented
      .filter((s) => typeof s === 'string' || !removeHashTags.has(s.hashtag))
      .map((s) => (typeof s === 'string' ? s : s.hashtag))
      .join('')
      .replaceAll(/(\s)+/g, '$1')
      .trim();
  }
  // Otherwise subtract out the literal string
  const hashtagSpans = filterMap(originalSegmented, (s) =>
    typeof s === 'string' ? undefined : [s.index, s.index + s.hashtag.length],
  );
  return originalNote
    ?.replaceAll(removed.trim(), (original, index) =>
      // Refuse to cut a tag in half
      hashtagSpans.some(([start, end]) => index > start && index < end) ? original : '',
    )
    .replaceAll(/\s+/g, ' ')
    .trim();
}

/** Break up a string into normal-string bits and hashtags */
function segmentHashtags(
  note: string | undefined,
): (string | { hashtag: string; index: number })[] {
  if (!note) {
    return [];
  }

  const result: (string | { hashtag: string; index: number })[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = hashtagRegex.exec(note))) {
    if (match.index > lastIndex) {
      const segment = note.substring(lastIndex, match.index);
      result.push(segment);
    }
    result.push({ hashtag: match[0], index: match.index });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < note.length) {
    result.push(note.substring(lastIndex, note.length));
  }
  return result;
}
