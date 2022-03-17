import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { resonantElementTagsByObjectiveHash } from 'data/d2/crafting-resonant-elements';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { DimDeepsight, DimItem, DimResonantElement, DimSocket } from '../item-types';

export type DimResonantElementTag =
  typeof resonantElementTagsByObjectiveHash[keyof typeof resonantElementTagsByObjectiveHash];
export const resonantElementTags: DimResonantElementTag[] = Object.values(
  resonantElementTagsByObjectiveHash
);
export const resonantElementObjectiveHashes = Object.keys(resonantElementTagsByObjectiveHash).map(
  (objectiveHashStr) => parseInt(objectiveHashStr, 10)
);

export function buildDeepsightInfo(
  item: DimItem,
  defs: D2ManifestDefinitions
): DimDeepsight | null {
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
    resonantElements: getResonantElements(item, defs),
  };
}

function getResonanceSocket(item: DimItem): DimSocket | undefined {
  if (item.bucket.inWeapons && item.sockets) {
    return item.sockets.allSockets.find(isDeepsightResonanceSocket);
  }
}

export function isDeepsightResonanceSocket(socket: DimSocket): boolean {
  return Boolean(
    socket.plugged?.plugDef.plug.plugCategoryHash ===
      PlugCategoryHashes.CraftingPlugsWeaponsModsMemories && socket.plugged?.plugDef.objectives
  );
}

function getResonantElements(item: DimItem, defs: D2ManifestDefinitions): DimResonantElement[] {
  const results: DimResonantElement[] = [];

  const sockets = item.sockets?.allSockets;
  if (sockets) {
    for (const socket of sockets) {
      for (const plug of socket.plugOptions) {
        for (const objective of plug.plugObjectives) {
          const elementTag = resonantElementTagsByObjectiveHash[objective.objectiveHash];
          if (elementTag) {
            const def = defs.Objective.get(objective.objectiveHash);
            if (def) {
              results.push({
                tag: elementTag,
                icon: def.displayProperties?.iconSequences[0]?.frames[1],
                name: def.progressDescription,
              });
            }
          }
        }
      }
    }
  }

  return results;
}
