import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { isPluggableItem } from 'app/inventory/store/sockets';
import {
  isModPickerCategory,
  LockedArmor2ModMap,
  ModPickerCategories,
} from 'app/loadout-builder/types';
import { getSpecialtySocketMetadataByPlugCategoryHash } from 'app/utils/item-utils';

export function getLockedModMapFromModHashes(defs: D2ManifestDefinitions, modHashes?: number[]) {
  const groups: LockedArmor2ModMap = {
    [ModPickerCategories.general]: [],
    [ModPickerCategories.helmet]: [],
    [ModPickerCategories.gauntlets]: [],
    [ModPickerCategories.chest]: [],
    [ModPickerCategories.leg]: [],
    [ModPickerCategories.classitem]: [],
    [ModPickerCategories.seasonal]: [],
  };

  for (const hash of modHashes || []) {
    const modDef = defs.InventoryItem.get(hash);

    if (isPluggableItem(modDef)) {
      const { plugCategoryHash } = modDef.plug;
      const metadata = getSpecialtySocketMetadataByPlugCategoryHash(plugCategoryHash);

      if (metadata) {
        groups.seasonal.push({ modDef, category: 'seasonal', season: metadata.season });
      } else if (isModPickerCategory(plugCategoryHash)) {
        groups[plugCategoryHash].push({ modDef, category: plugCategoryHash });
      }
    }
  }

  return groups;
}
