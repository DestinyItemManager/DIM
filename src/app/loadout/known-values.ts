import {
  armor2PlugCategoryHashes,
  armor2PlugCategoryHashesByName,
} from 'app/search/d2-known-values';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import raidModPlugCategoryHashes from 'data/d2/raid-mod-plug-category-hashes.json';

export const slotSpecificPlugCategoryHashes = [
  armor2PlugCategoryHashesByName.helmet,
  armor2PlugCategoryHashesByName.gauntlets,
  armor2PlugCategoryHashesByName.chest,
  armor2PlugCategoryHashesByName.leg,
  armor2PlugCategoryHashesByName.classitem,
];

/**
 * The plug category hashes that belong to the 5th mod slot, such as raid and nightmare mods.
 * Note that while artifice mod slots are also the 5th slot, we don't model them as activity mods.
 */
export const activityModPlugCategoryHashes = [
  ...raidModPlugCategoryHashes,
  PlugCategoryHashes.EnhancementsSeasonMaverick,
];

export const knownModPlugCategoryHashes = [
  ...armor2PlugCategoryHashes,
  ...activityModPlugCategoryHashes,
  // FIXME add artifice here
  99999999,
];
