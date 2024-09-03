import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { THE_FORBIDDEN_BUCKET } from 'app/search/d2-known-values';
import {
  DestinyInventoryItemDefinition,
  DestinyProfileRecordsComponent,
  DestinyProfileResponse,
  DestinyRecordToastStyle,
} from 'bungie-api-ts/destiny2';
import memoizeOne from 'memoize-one';
import { DimItem } from '../item-types';

/**
 * Generate a table from item name to the record for their crafting pattern.
 */
const itemNameToCraftingPatternRecordHash = memoizeOne((defs: D2ManifestDefinitions) => {
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

/**
 * Figure out the associated crafting pattern for this item.
 */
export function buildPatternInfo(
  item: DimItem,
  itemDef: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions,
  profileRecords: DestinyProfileRecordsComponent | undefined,
  characterRecords: DestinyProfileResponse['characterRecords']['data'],
) {
  // Craftable items will have a reference to their recipe item
  const recipeItemHash = itemDef.inventory?.recipeItemHash;
  if (!recipeItemHash && itemDef.inventory?.bucketTypeHash !== THE_FORBIDDEN_BUCKET) {
    return undefined;
  }

  // Best we can do so far is to match up crafting patterns to items by their name: https://github.com/DestinyItemManager/DIM/pull/8420#issuecomment-1139188482
  const patternRecordHash = itemNameToCraftingPatternRecordHash(defs)[item.name];
  if (patternRecordHash) {
    return (
      profileRecords?.records[patternRecordHash] ??
      (characterRecords && Object.values(characterRecords)[0].records[patternRecordHash])
    );
  }
  return undefined;
}
