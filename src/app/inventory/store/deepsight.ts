import { THE_FORBIDDEN_BUCKET } from 'app/search/d2-known-values';
import { socketContainsPlugWithCategory } from 'app/utils/socket-utils';
import { DestinyRecordState } from 'bungie-api-ts/destiny2';
import { resonantElementTagsByObjectiveHash } from 'data/d2/crafting-resonant-elements';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { DimItem, DimSocket } from '../item-types';

export const resonantElementObjectiveHashes = Object.keys(resonantElementTagsByObjectiveHash).map(
  (objectiveHashStr) => parseInt(objectiveHashStr, 10)
);

export function buildDeepsightInfo(item: DimItem): boolean {
  const resonanceSocket = getResonanceSocket(item);
  if (!resonanceSocket?.plugged?.plugObjectives) {
    return false;
  }

  // Only show deepsight if the pattern hasn't been completed
  return (
    !item.patternUnlockRecord ||
    Boolean(item.patternUnlockRecord.state & DestinyRecordState.ObjectiveNotCompleted)
  );
}

function getResonanceSocket(item: DimItem): DimSocket | undefined {
  if (item.sockets && (item.bucket.inWeapons || item.bucket.hash === THE_FORBIDDEN_BUCKET)) {
    return item.sockets.allSockets.find(isDeepsightResonanceSocket);
  }
}

export function isDeepsightResonanceSocket(socket: DimSocket): boolean {
  return Boolean(
    socketContainsPlugWithCategory(socket, PlugCategoryHashes.CraftingPlugsWeaponsModsMemories)
  );
}
