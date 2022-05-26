import { socketContainsPlugWithCategory } from 'app/utils/socket-utils';
import { resonantElementTagsByObjectiveHash } from 'data/d2/crafting-resonant-elements';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { DimDeepsight, DimItem, DimSocket } from '../item-types';

export const resonantElementObjectiveHashes = Object.keys(resonantElementTagsByObjectiveHash).map(
  (objectiveHashStr) => parseInt(objectiveHashStr, 10)
);

export function buildDeepsightInfo(item: DimItem): DimDeepsight | null {
  const resonanceSocket = getResonanceSocket(item);
  if (!resonanceSocket || !resonanceSocket.plugged?.plugObjectives) {
    return null;
  }

  const attunementObjective = resonanceSocket.plugged.plugObjectives[0];
  return {
    complete: attunementObjective?.complete,
    progress: attunementObjective?.progress
      ? attunementObjective.progress / attunementObjective.completionValue
      : 0,
  };
}

function getResonanceSocket(item: DimItem): DimSocket | undefined {
  if (item.bucket.inWeapons && item.sockets) {
    return item.sockets.allSockets.find(isDeepsightResonanceSocket);
  }
}

export function isDeepsightResonanceSocket(socket: DimSocket): boolean {
  return Boolean(
    socketContainsPlugWithCategory(socket, PlugCategoryHashes.CraftingPlugsWeaponsModsMemories) &&
      socket.plugged.plugDef.objectives
  );
}
