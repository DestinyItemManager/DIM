import { Loadout } from 'app/loadout/loadout-types';

/**
 * Compute a mapping of normalized hashtags to loadouts that contain them.
 * Hashtags are normalized by removing the '#' prefix, replacing underscores with spaces,
 * and converting to lowercase for case-insensitive grouping.
 */
export function computeLoadoutsByHashtag(
  loadouts: Loadout[],
  getHashtagsFromLoadout: (loadout: Loadout) => string[],
): { [hashtag: string]: Loadout[] } {
  const loadoutsByHashtag: { [hashtag: string]: Loadout[] } = {};
  for (const loadout of loadouts) {
    const hashtags = getHashtagsFromLoadout(loadout);
    for (const hashtag of hashtags) {
      const normalizedHashtag = hashtag.replace('#', '').replace(/_/g, ' ').toLowerCase();
      (loadoutsByHashtag[normalizedHashtag] ??= []).push(loadout);
    }
  }
  return loadoutsByHashtag;
}
