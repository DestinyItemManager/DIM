import {
  armor2PlugCategoryHashes,
  armor2PlugCategoryHashesByName,
  D2ArmorStatHashByName,
} from 'app/search/d2-known-values';
import raidModPlugCategoryHashes from 'data/d2/raid-mod-plug-category-hashes.json';

export const armorStatHashes = [
  D2ArmorStatHashByName.intellect,
  D2ArmorStatHashByName.discipline,
  D2ArmorStatHashByName.strength,
  D2ArmorStatHashByName.mobility,
  D2ArmorStatHashByName.recovery,
  D2ArmorStatHashByName.resilience,
];

export const slotSpecificPlugCategoryHashes = [
  armor2PlugCategoryHashesByName.helmet,
  armor2PlugCategoryHashesByName.gauntlets,
  armor2PlugCategoryHashesByName.chest,
  armor2PlugCategoryHashesByName.leg,
  armor2PlugCategoryHashesByName.classitem,
];

export const knownModPlugCategoryHashes = [
  ...armor2PlugCategoryHashes,
  ...raidModPlugCategoryHashes,
];
