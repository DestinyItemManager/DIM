import { compact, filterMap } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { maxBy } from 'es-toolkit';
import { ItemInfos } from './dim-item-info';

/**
 * Groups hashtags by their canonical (case-insensitive) form and selects the best variant to display.
 * Uses frequency as the primary criterion, with a preference for variants with more uppercase letters.
 */
export function groupHashtagsByCanonicalForm(hashtags: string[]): Record<string, string> {
  // {
  //   '#pve': {
  //     variants: {
  //       '#PVE': 4,
  //       '#pve': 2
  //     },              <- hashtagCollection
  //     count: 6        <- structure
  //   }
  // }
  const variantCounts: Record<string, Record<string, number>> = {};

  // Count each variant
  for (const hashtag of hashtags) {
    const lower = hashtag.toLowerCase();
    variantCounts[lower] ??= {};
    variantCounts[lower][hashtag] = (variantCounts[lower][hashtag] ?? 0) + 1;
  }

  // Pick best variant for each canonical form
  const result: Record<string, string> = {};
  for (const [lowerKey, variants] of Object.entries(variantCounts)) {
    const bestVariant = maxBy(Object.entries(variants), ([, count]) => count)![0];
    result[lowerKey] = bestVariant;
  }

  return result;
}

/**
 * Collects all hashtags from all item notes.
 *
 * Orders by use count, de-dupes case-insensitive, and picks the most popular capitalization.
 */
export function collectHashtagsFromInfos(itemInfos: ItemInfos) {
  const allHashtags: string[] = [];
  const hashtagCounts: NodeJS.Dict<number> = {};

  for (const info of Object.values(itemInfos)) {
    const hashtags = getHashtagsFromString(info.notes);
    for (const h of hashtags) {
      allHashtags.push(h);
      const lower = h.toLowerCase();
      hashtagCounts[lower] = (hashtagCounts[lower] ?? 0) + 1;
    }
  }

  const canonicalHashtags = groupHashtagsByCanonicalForm(allHashtags);

  return Object.entries(canonicalHashtags)
    .map(([lowerKey, canonicalForm]) => [canonicalForm, hashtagCounts[lowerKey]!] as const)
    .sort(compareBy((t) => -t[1]))
    .map((t) => t[0]);
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
