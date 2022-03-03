import { resonantElementObjectiveHashes } from 'app/search/d2-known-values';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { DimDeepsight, DimItem, DimSocket } from '../item-types';

export function buildDeepsightInfo(item: DimItem): DimDeepsight | null {
  const resonanceSocket = getResonanceSocket(item);
  if (!resonanceSocket || !resonanceSocket.plugged?.plugObjectives) {
    return null;
  }

  const attunementObjective = resonanceSocket.plugged.plugObjectives[0];
  const itemObjectiveHashes = item.sockets?.allSockets?.flatMap((s) =>
    s.plugOptions.flatMap((p) => p.plugObjectives.map((o) => o.objectiveHash))
  );
  return {
    complete: attunementObjective?.complete,
    progress: attunementObjective?.progress
      ? attunementObjective.progress / attunementObjective.completionValue
      : 0,
    resonantElementObjectiveHashes: itemObjectiveHashes
      ? _.intersection(itemObjectiveHashes, resonantElementObjectiveHashes)
      : [],
  };
}

function getResonanceSocket(item: DimItem): DimSocket | undefined {
  if (item.bucket.inWeapons && item.sockets) {
    return item.sockets.allSockets.find(
      (s) =>
        s.plugged?.plugDef.plug.plugCategoryHash ===
          PlugCategoryHashes.CraftingPlugsWeaponsModsMemories && s.plugged?.plugDef.objectives
    );
  }
}
