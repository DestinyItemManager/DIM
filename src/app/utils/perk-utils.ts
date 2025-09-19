import perkToEnhanced from 'data/d2/trait-to-enhanced-trait.json';
import { invert } from './collections';

// map an enhanced perk hash to the unenhanced version.
const enhancedToPerk = invert(perkToEnhanced, Number);

/** Convert a perk hash to its enhanced version, if possible, else returns it unchanged (maybe it was already enhanced?) */
export function normalizeToEnhanced(perkHash: number) {
  return perkToEnhanced[perkHash] ?? perkHash;
}

/** Convert a perk hash to its un-enhanced version(s), if possible, else returns it unchanged (maybe it wasn't enhanced?) */
export function normalizeToUnenhanced(perkHash: number) {
  return enhancedToPerk[perkHash] ?? perkHash;
}

/** Return the hash of the enhanced version of this perk, assuming it is an un-enhanced perk. */
export function enhancedVersion(perkHash: number): number | undefined {
  return perkToEnhanced[perkHash];
}

/** Return the hash of the unenhanced version of this perk, assuming it is an enhanced perk. */
export function unenhancedVersion(perkHash: number): number | undefined {
  return enhancedToPerk[perkHash];
}

/** Is this hash one of our known enhanced versions of a regular perk? */
export function isEnhancedPerkHash(perkHash: number) {
  return perkHash in enhancedToPerk;
}
