import { compact, filterMap } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { maxBy } from 'es-toolkit';
import { ItemInfos } from './dim-item-info';

/**
 * An object that can collect usage of hashtags and return their most popular form.
 */
export class HashTagTracker {
  // {
  //   '#pve': {
  //     variants: {
  //       '#PVE': 4,
  //       '#pve': 2
  //     },
  //     count: 6
  //   }
  // }
  hashtagCollection: NodeJS.Dict<{ variants: NodeJS.Dict<number>; count: number }> = {};

  addHashtag(hashtag: string) {
    const lower = hashtag.toLowerCase();
    this.hashtagCollection[lower] ??= { count: 0, variants: {} };
    this.hashtagCollection[lower].count++;
    this.hashtagCollection[lower].variants[hashtag] ??= 0;
    this.hashtagCollection[lower].variants[hashtag]++;
  }

  /**
   * Gets the best "canonical" form of a hashtag to use for display.
   */
  canonicalForm(hashtag: string): string {
    const lower = hashtag.toLowerCase();
    const normalizedMeta = this.hashtagCollection[lower];
    if (!normalizedMeta) {
      return hashtag; // No variants, return as is
    }
    return extractMostPopular(normalizedMeta)[0];
  }

  allHashtags(): string[] {
    return Object.values(this.hashtagCollection)
      .map((m) => extractMostPopular(m!))
      .sort(compareBy(([, count]) => -count))
      .map(([variant]) => variant);
  }
}

function extractMostPopular(normalizedMeta: {
  variants: NodeJS.Dict<number>;
  count: number;
}): [canonicalForm: string, totalObserved: number] {
  const countsByVariant = Object.entries(normalizedMeta.variants);
  const mostPopularVariant = maxBy(countsByVariant, (v) => v[1]!)![0];
  return [mostPopularVariant, normalizedMeta.count];
}

/**
 * Collects all hashtags from all item notes.
 *
 * Orders by use count, de-dupes case-insensitive, and picks the most popular capitalization.
 */
export function collectHashtagsFromInfos(itemInfos: ItemInfos) {
  const hashtagTracker = new HashTagTracker();

  for (const info of Object.values(itemInfos)) {
    const hashtags = getHashtagsFromString(info.notes);
    for (const h of hashtags) {
      hashtagTracker.addHashtag(h);
    }
  }

  return hashtagTracker.allHashtags();
}

const hashtagRegex = /(^|[\s,])(#[\p{L}\p{N}\p{Private_Use}\p{Other_Symbol}_:-]+)/gu;

export function getHashtagsFromString(...notes: (string | null | undefined)[]) {
  return notes.flatMap((note) => Array.from(note?.matchAll(hashtagRegex) ?? [], (m) => m[2]));
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
  return compact([...originalSegmented, ' ', ...filteredAppendSegments])
    .map((s) => (typeof s === 'string' ? s : s.hashtag))
    .join('')
    .replaceAll(/(\s)+/g, '$1')
    .trim();
}

const allHashtagsRegex =
  /^\s*(?:(?:^|[\s,])#[\p{L}\p{N}\p{Private_Use}\p{Other_Symbol}_:-]+\s*)+$/u;

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
    const removeHashTags = new Set(getHashtagsFromString(removed));

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
    const matchIndex = match.index + match[1].length;
    if (matchIndex > lastIndex) {
      const segment = note.substring(lastIndex, matchIndex);
      result.push(segment);
    }
    result.push({ hashtag: match[2], index: matchIndex });
    lastIndex = matchIndex + match[2].length;
  }
  if (lastIndex < note.length) {
    result.push(note.substring(lastIndex, note.length));
  }
  return result;
}
