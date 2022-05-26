import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
import {
  DestinyObjectiveProgress,
  DestinyObjectiveUiStyle,
  DestinyRecordToastStyle,
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { DimCrafted, DimItem, DimSocket } from '../item-types';

/** the socket category containing the single socket with weapon crafting objectives */
export const craftedSocketCategoryHash = 3583996951;

/** the socket category containing the Mementos */
export const mementoSocketCategoryHash = 3201856887;

/**
 * Generate a table from item name to the record for their crafting pattern.
 */
export const itemNameToCraftingPatternRecordHash = _.once((defs: D2ManifestDefinitions) => {
  const recordHashesByName: { [itemName: string]: number } = {};
  if (defs) {
    for (const record of Object.values(defs.Record.getAll())) {
      if (record.completionInfo?.toastStyle === DestinyRecordToastStyle.CraftingRecipeUnlocked) {
        recordHashesByName[record.displayProperties.name] = record.hash;
      }
    }
  }
  return recordHashesByName;
});

export function buildCraftedInfo(
  item: DimItem,
  defs: D2ManifestDefinitions
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
        dateCrafted = objective.progress ? objective.progress * 1000 : undefined;
      }
    }
  }

  return { level, progress, dateCrafted };
}
