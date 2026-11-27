const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Standard/Normal activity hashes, in weekly rotation order.
 *
 * The live Weekly Dungeon Challenge is authoritative. This is only used when live challenges across
 * all characters do not identify both rotating dungeons.
 */
export const ROTATING_DUNGEON_ACTIVITY_HASHES = [
  2032534090, // Shattered Throne
  2582501063, // Pit of Heresy
  1077850348, // Prophecy
  4078656646, // Grasp of Avarice
  2823159265, // Duality
  1262462921, // Spire of the Watcher
  313828469, // Ghosts of the Deep
  2004855007, // Warlord's Ruin
  300092127, // Vesper's Host
  3834447244, // Sundered Doctrine
] as const;

/**
 * Equilibrium is currently featured every week outside the two-dungeon rotation.
 */
export const EQUILIBRIUM_ACTIVITY_HASH = 2727361621;

/**
 * Use reset of 2026-11-24 17:00 UTC as anchor date:
 * Duality + Vesper's Host.
 */
const ROTATION_ANCHOR = Date.parse('2026-11-24T17:00:00Z');
/**
 * Featured dungeons are just fixed offsets of rotation array.
 */
const ROTATION_ANCHOR_INDICES = [4, 8] as const;

const rotatingDungeonActivityHashes = new Set<number>(ROTATING_DUNGEON_ACTIVITY_HASHES);

export function isRotatingDungeonActivityHash(activityHash: number): boolean {
  return rotatingDungeonActivityHashes.has(activityHash);
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

/**
 * Calculate the expected two-dungeon rotation for the reset containing `at`.
 */
export function getExpectedRotatingDungeonHashes(at = Date.now()): number[] {
  const weeksSinceAnchor = Math.floor((at - ROTATION_ANCHOR) / MILLISECONDS_PER_WEEK);

  return ROTATION_ANCHOR_INDICES.map(
    (anchorIndex) =>
      ROTATING_DUNGEON_ACTIVITY_HASHES[
        positiveModulo(anchorIndex + weeksSinceAnchor, ROTATING_DUNGEON_ACTIVITY_HASHES.length)
      ],
  );
}

/**
 * Determine the currently featured dungeons. Prefer live Bungie challenges when they identify the rotation.
 * Fall back to the expected rotation only when fewer than two live dungeon challenges remain visible.
 */
export function resolveRotatingDungeonHashes(
  liveActivityHashes: Iterable<number>,
  at = Date.now(),
): number[] {
  const liveHashes = [...new Set([...liveActivityHashes].filter(isRotatingDungeonActivityHash))];

  if (liveHashes.length >= 2) {
    return liveHashes;
  }

  return [...new Set([...getExpectedRotatingDungeonHashes(at), ...liveHashes])];
}
