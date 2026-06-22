import type { BucketSortType } from 'app/inventory/inventory-buckets';

/**
 * Single source of truth for i18n keys built from a prefix plus a runtime value.
 * The i18next-scanner reads this to emit the full `Prefix.Value` key set, which
 * in turn types `t()`. Keep it pure data (only `import type`) so the scanner can
 * load it standalone in Node.
 */

// Mirrors BucketSortType (enforced by `satisfies`) so titles exist for every category.
export const BUCKETS = [
  'General',
  'Inventory',
  'Postmaster',
  'Progress',
  'Unknown',
  'Weapons',
  'Armor',
] as const satisfies readonly BucketSortType[];

/** Pursuit groupings rendered as `Progress.<group>` titles. */
export const PROGRESS_GROUPS = ['Bounties', 'Items', 'Quests'] as const;

/** Socket categories rendered as `Sockets.Insert.<kind>` / `Sockets.Select.<kind>`. */
export const SOCKET_KINDS = [
  'Mod',
  'Ability',
  'Shader',
  'Ornament',
  'Fragment',
  'Aspect',
  'Projection',
  'Transmat',
  'Super',
] as const;

/** D1 activity difficulties rendered as `Activities.<difficulty>`. */
export const DIFFICULTIES = ['Normal', 'Hard'] as const;

/** `Prefix -> values`. The scanner flattens this to `Prefix.Value` keys; the app references them as `t(`Prefix.${value}`)`. */
export const I18N_KEYS = {
  Bucket: BUCKETS,
  Progress: PROGRESS_GROUPS,
  'Sockets.Insert': SOCKET_KINDS,
  'Sockets.Select': SOCKET_KINDS,
  Activities: DIFFICULTIES,
} as const;

/** Context variants by base key. The scanner emits a `BaseKey_<context>` key for each; the app selects one via i18next's `context` option. */
export const I18N_CONTEXTS = {
  'Countdown.Days': ['compact'],
  'Stats.TierProgress': ['Max'],
} as const;
