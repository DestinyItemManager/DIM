import { socketContainsPlugWithCategory } from 'app/utils/socket-utils';
import { DestinyObjectiveProgress } from 'bungie-api-ts/destiny2';
import { resonantElementTagsByObjectiveHash } from 'data/d2/crafting-resonant-elements';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { DimDeepsight, DimItem, DimSocket } from '../item-types';

export const resonantElementObjectiveHashes = Object.keys(resonantElementTagsByObjectiveHash).map(
  (objectiveHashStr) => parseInt(objectiveHashStr, 10)
);

const fakeObjective: DestinyObjectiveProgress = {
  complete: false,
  objectiveHash: 0,
  progress: 0,
  visible: false,
  completionValue: 1000,
};

export function buildDeepsightInfo(item: DimItem): DimDeepsight | undefined {
  const resonanceSocket = getResonanceSocket(item);
  if (!resonanceSocket?.plugged?.plugObjectives) {
    return undefined;
  }

  const attunementObjective = resonanceSocket.plugged.plugObjectives[0];
  return {
    attunementObjective: attunementObjective ?? fakeObjective,
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
