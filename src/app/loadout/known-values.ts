import {
  armor2PlugCategoryHashes,
  armor2PlugCategoryHashesByName,
  D2ArmorStatHashByName,
} from 'app/search/d2-known-values';
import { PlugCategoryHashes } from 'data/d2/generated-enums';

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

// TODO generate this somehow so we dont need to maintain it
export const raidPlugCategoryHashes = [
  PlugCategoryHashes.EnhancementsSeasonOutlaw, // last wish
  PlugCategoryHashes.EnhancementsRaidGarden, // garden of salvation
  PlugCategoryHashes.EnhancementsRaidDescent, // deep stone crypt
  PlugCategoryHashes.EnhancementsRaidV520, // vault of glass
];

export const knownModPlugCategoryHashes = [...armor2PlugCategoryHashes, ...raidPlugCategoryHashes];
