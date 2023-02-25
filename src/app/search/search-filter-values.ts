import { DamageType } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { D1BucketHashes, D1LightStats } from './d1-known-values';
import {
  armorStats,
  CUSTOM_TOTAL_STAT_HASH,
  D2ArmorStatHashByName,
  D2LightStats,
  D2WeaponStatHashByName,
  swordStatsByName,
  TOTAL_STAT_HASH,
} from './d2-known-values';

// ✨ magic values ✨
// this file has non-programatically decided information
// hashes, names, & enums, hand-crafted and chosen by us

// this correlation is solely for element filter names
export const damageNamesByEnum: { [key in DamageType]: string | null } = {
  0: null,
  [DamageType.Kinetic]: 'kinetic',
  [DamageType.Arc]: 'arc',
  [DamageType.Thermal]: 'solar',
  [DamageType.Void]: 'void',
  [DamageType.Raid]: 'raid',
  [DamageType.Stasis]: 'stasis',
  [DamageType.Strand]: 'strand',
};

// typescript doesn't understand array.filter
export const damageTypeNames = Object.values(damageNamesByEnum).filter(
  (d) => ![null, 'raid'].includes(d)
) as string[];

/**
 * these stats exist on DIM armor. the 6 real API ones, supplemented by a synthetic Total stat.
 * these are the armor stats that can be looked up by name
 */
export const dimArmorStatHashByName = {
  ...D2ArmorStatHashByName,
  total: TOTAL_STAT_HASH,
  custom: CUSTOM_TOTAL_STAT_HASH,
};

/** stats names used to create armor-specific filters, real ones plus an "any" keyword */
export const searchableArmorStatNames = [...Object.keys(dimArmorStatHashByName), 'any'];

/** armor stat hashes to check for the "any" keyword */
export const armorAnyStatHashes = armorStats;

/** stat hashes to calculate max values for */
export const armorStatHashes = Object.values(dimArmorStatHashByName);

/** all-stat table, for looking up stat hashes given a queried stat name */
export const statHashByName: Record<string, number> = {
  ...D2WeaponStatHashByName,
  ...swordStatsByName,
  ...dimArmorStatHashByName,
};

/** all-stat list, to generate filters from */
export const allStatNames = [...Object.keys(statHashByName), 'any'];

export const lightStats = [...D2LightStats, ...D1LightStats];

/** compare against DimItem.bucket.hash */
export const cosmeticTypes: (BucketHashes | D1BucketHashes)[] = [
  BucketHashes.Shaders,
  BucketHashes.Modifications,
  BucketHashes.Emotes_Equippable,
  BucketHashes.Emotes_Invisible,
  BucketHashes.Emblems,
  BucketHashes.Vehicle,
  D1BucketHashes.Horn,
  BucketHashes.Ships,
  BucketHashes.Finishers,
];
