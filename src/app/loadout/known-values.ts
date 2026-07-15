import {
  armor2PlugCategoryHashes,
  armor2PlugCategoryHashesByName,
} from 'app/search/d2-known-values';
import { D2CalculatedSeason } from 'data/d2/d2-season-info';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import raidModPlugCategoryHashes from 'data/d2/raid-mod-plug-category-hashes.json' with { type: 'json' };

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
  PlugCategoryHashes.CoreGearSystemsArmorTieringPlugsTuningMods,
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

// TODO: this should probably go in d2ai
export const setBonusModToSet: Record<number, number> = {
  139044974: 2132906400, // New Demotic
  139044987: 2391762223, // Swordmaster
  721111598: 239346083, // Techsec
  721111611: 3252452908, // Last Discipline
  1012508294: 2258577662, // Wild Anthem
  1012508307: 3734029045, // Ferropotent
  1220635053: 3259216565, // Twofold Crown
  1220635064: 1083114430, // Bushido
  1404854454: 1223381128, // AION Renewal
  1530138662: 2450108908, // Wayward Psyche (Set)
  1841728090: 4222859846, // Sage Protector
  2824493179: 1007956300, // Accretion -> Collective Psyche
  2872740129: 2151917545, // Thriving Survivor
  3573256294: 2947197258, // Disaster Corps (Set)
  3573256307: 2751989785, // Smoke Jumper (Set)
  3782433407: 3737690559, // Lustrous
  3834187337: 305966751, // Iron Panoply (Set)
  3874641219: 2839368623, // Shrewd Survivor
  4119627352: 894715166, // AION Adapter
};
