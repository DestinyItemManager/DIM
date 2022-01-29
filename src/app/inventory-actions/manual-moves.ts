import { DimItem } from './item-types';

/**
 * A map from item index to the last time it was manually moved in this
 * session. We use this to avoid auto-moving things you just moved manually.
 * This could be in Redux, but it doesn't affect anything visually, so it's
 * a bit easier to just have it be a global.
 */
const moveTouchTimestamps = new Map<string, number>();

export function updateManualMoveTimestamp(item: DimItem) {
  moveTouchTimestamps.set(item.index, Date.now());
}

export function getLastManuallyMoved(item: DimItem) {
  return moveTouchTimestamps.get(item.index) ?? 0;
}

// TODO: do it for loadouts too!
