import perkToEnhanced from 'data/d2/trait-to-enhanced-trait.json';

/** Convert a perk hash to its enhanced version, if possible, else returns it unchanged (maybe it was already enhanced?) */
export function normalizeEnhancedness(perkHash: number) {
  return perkToEnhanced[perkHash] ?? perkHash;
}
