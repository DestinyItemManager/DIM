import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { isPluggableItem } from 'app/inventory/store/sockets';
import {
  isModPickerCategory,
  LockedArmor2ModMap,
  ModPickerCategories,
  raidPlugs,
} from 'app/loadout-builder/types';
import {
  combatCompatiblePlugCategoryHashes,
  legacyCompatiblePlugCategoryHashes,
} from 'app/search/specialty-modslots';

export function getLockedModMapFromModHashes(defs: D2ManifestDefinitions, modHashes?: number[]) {
  const groups: LockedArmor2ModMap = {
    [ModPickerCategories.general]: [],
    [ModPickerCategories.helmet]: [],
    [ModPickerCategories.gauntlets]: [],
    [ModPickerCategories.chest]: [],
    [ModPickerCategories.leg]: [],
    [ModPickerCategories.classitem]: [],
    [ModPickerCategories.other]: [],
    [ModPickerCategories.raid]: [],
  };

  for (const hash of modHashes || []) {
    const modDef = defs.InventoryItem.get(hash);

    if (isPluggableItem(modDef)) {
      const { plugCategoryHash } = modDef.plug;

      if (raidPlugs.includes(plugCategoryHash)) {
        groups.raid.push({ modDef, category: 'raid' });
      } else if (
        combatCompatiblePlugCategoryHashes.includes(plugCategoryHash) ||
        legacyCompatiblePlugCategoryHashes.includes(plugCategoryHash)
      ) {
        groups.other.push({ modDef, category: 'other' });
      } else if (isModPickerCategory(plugCategoryHash)) {
        groups[plugCategoryHash].push({ modDef, category: plugCategoryHash });
      }
    }
  }

  return groups;
}
