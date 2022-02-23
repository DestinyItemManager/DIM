import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
import { DestinyObjectiveProgress, DestinyObjectiveUiStyle } from 'bungie-api-ts/destiny2';
import { DimCrafted, DimItem, DimSocket } from '../item-types';

/** the socket category containing the single socket with weapon crafting objectives */
export const craftedSocketCategoryHash = 3583996951;

export function buildCraftedInfo(item: DimItem, defs: D2ManifestDefinitions): DimCrafted | null {
  const craftedSocket = getCraftedSocket(item);
  if (!craftedSocket) {
    return null;
  }

  const objectives = craftedSocket.plugged?.plugObjectives;
  if (!objectives) {
    return null;
  }

  return getCraftingInfo(defs, objectives);
}

/** find the item socket that could contain the "this weapon was crafted" plug with its objectives */
function getCraftedSocket(item: DimItem): DimSocket | undefined {
  if (item.bucket.inWeapons && item.sockets) {
    return getFirstSocketByCategoryHash(item.sockets, craftedSocketCategoryHash);
  }
}

function getCraftingInfo(defs: D2ManifestDefinitions, objectives: DestinyObjectiveProgress[]) {
  let level;
  let progress;
  let dateCrafted;

  for (const objective of objectives) {
    const def = defs.Objective.get(objective.objectiveHash);
    if (def) {
      if (def.uiStyle === DestinyObjectiveUiStyle.CraftingWeaponLevel) {
        level = objective.progress;
      } else if (def.uiStyle === DestinyObjectiveUiStyle.CraftingWeaponLevelProgress) {
        progress =
          objective.progress !== undefined && objective.completionValue > 0
            ? objective.progress / objective.completionValue
            : undefined;
      } else if (def.uiStyle === DestinyObjectiveUiStyle.CraftingWeaponTimestamp) {
        dateCrafted = objective.progress;
      }
    }
  }

  return { level, progress, dateCrafted };
}
