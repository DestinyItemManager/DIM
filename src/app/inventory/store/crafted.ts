import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { warnLog } from 'app/utils/log';
import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
import { DestinyObjectiveProgress, DestinyObjectiveUiStyle } from 'bungie-api-ts/destiny2';
import { DimCrafted, DimItem, DimSocket } from '../item-types';

/** the socket category containing the single socket with weapon crafting objectives */
export const craftedSocketCategoryHash = 3583996951;

/** the socket category containing the Mementos */
export const mementoSocketCategoryHash = 3201856887;

export function buildCraftedInfo(
  item: DimItem,
  defs: D2ManifestDefinitions,
): DimCrafted | undefined {
  const craftedSocket = getCraftedSocket(item);
  if (!craftedSocket) {
    return undefined;
  }

  const objectives = craftedSocket.plugged?.plugObjectives;
  if (!objectives) {
    return undefined;
  }

  return getCraftingInfo(defs, objectives);
}

/** find the item socket that could contain the "this weapon was crafted" plug with its objectives */
export function getCraftedSocket(item: DimItem): DimSocket | undefined {
  if (item.bucket.inWeapons && item.sockets) {
    return getFirstSocketByCategoryHash(item.sockets, craftedSocketCategoryHash);
  }
}

function getCraftingInfo(
  defs: D2ManifestDefinitions,
  objectives: DestinyObjectiveProgress[],
): DimCrafted | undefined {
  let level: number | undefined;
  let progress: number | undefined;
  let craftedDate: number | undefined;

  for (const objective of objectives) {
    const def = defs.Objective.get(objective.objectiveHash);
    if (def) {
      if (def.uiStyle === DestinyObjectiveUiStyle.CraftingWeaponLevel) {
        level = objective.progress!;
      } else if (def.uiStyle === DestinyObjectiveUiStyle.CraftingWeaponLevelProgress) {
        progress = objective.progress! / objective.completionValue;
      } else if (def.uiStyle === DestinyObjectiveUiStyle.CraftingWeaponTimestamp) {
        craftedDate = objective.progress!;
      }
    }
  }

  if (level === undefined || progress === undefined || craftedDate === undefined) {
    warnLog('Item is missing one of level, progress, craftedDate', {
      level,
      progress,
      craftedDate,
    });
    return undefined;
  }

  return { level, progress, craftedDate };
}
