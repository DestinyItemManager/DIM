import {
  armor2PlugCategoryHashes,
  armor2PlugCategoryHashesByName,
} from 'app/search/d2-known-values';
import { D2CalculatedSeason } from 'data/d2/d2-season-info';
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
  PlugCategoryHashes.EnhancementsArtifice,
];

/**
 * This hash is set for plugs that aren't included in an ingame loadout.
 */
export const UNSET_PLUG_HASH = 2166136261;

export const MAX_TIER = 10;
export const MAX_STAT = 200;

// Once Edge of Fate is released, we should show loadouts that can
// have any higher stats, not just higher tiers.
// TODO: Also make sure analysis ignores tiers
export const edgeOfFateReleased = D2CalculatedSeason >= 27;
// The current reasonable maximum stat value. We have this separate from
// MAX_STAT (which is the Edge of Fate value) to allow folks to theorycraft a
// bit before it releases. Afterwards they will be the same.
export const EFFECTIVE_MAX_STAT = edgeOfFateReleased ? MAX_STAT : 10 * MAX_TIER;
