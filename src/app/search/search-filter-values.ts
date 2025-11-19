import { StringLookup } from 'app/utils/util-types';
import { DamageType } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { D1BucketHashes, D1LightStats } from './d1-known-values';
import {
  D2ArmorStatHashByName,
  D2LightStats,
  D2WeaponStatHashByName,
  TOTAL_STAT_HASH,
  armorStats,
  realD2ArmorStatHashByName,
} from './d2-known-values';

// ✨ magic values ✨
// this file has non-programatically decided information
// hashes, names, & enums, hand-crafted and chosen by us

// this correlation is solely for element filter names
export const damageNamesByEnum: { [key in DamageType]: string | undefined } = {
  [DamageType.None]: undefined,
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
  (d) => d && d !== 'raid',
) as string[];

/**
 * these stats exist on DIM armor. the 6 real API ones, supplemented by a synthetic Total stat.
 * these are the armor stats that can be looked up by name
 */
export const dimArmorStatHashByName: StringLookup<number> = {
  ...D2ArmorStatHashByName,
  total: TOTAL_STAT_HASH,
};

/** stats names used to create armor-specific filters, real ones plus an "any" keyword */
export const searchableArmorStatNames = [...Object.keys(dimArmorStatHashByName), 'any'];

/** armor stat hashes to check for the "any" keyword */
export const armorAnyStatHashes = armorStats;

/** armor 3.0 stat names including "primary" "secondary" and "tertiary" for filtering */
export const armor3OrdinalIndexByName: StringLookup<number> = {
  primary: 0,
  secondary: 1,
  tertiary: 2,
};

export const searchableD2Armor3StatNames = [
  ...Object.keys(realD2ArmorStatHashByName),
  ...Object.keys(armor3OrdinalIndexByName),
  'unfocused',
];

/** stat hashes to calculate max values for */
export const armorStatHashes = Object.values(dimArmorStatHashByName) as number[];

/** all-stat table, for looking up stat hashes given a queried stat name */
export const statHashByName: Record<string, number> = {
  ...D2WeaponStatHashByName,
  ...dimArmorStatHashByName,
};

/** Lowercase, sometimes-abbreviated stat names, used in search filters. */
export const weaponStatNames = Object.keys(D2WeaponStatHashByName);

/** all-stat list, to generate filters from */
export const allStatNames = [...Object.keys(statHashByName), 'any'];

// Support (for armor) these aliases for the stat in the nth rank
export const est = {
  highest: 0,
  secondhighest: 1,
  thirdhighest: 2,
  fourthhighest: 3,
  fifthhighest: 4,
  sixthhighest: 5,
} as const;

export const estStatNames = Object.keys(est);

export const statOrdinals: StringLookup<number> = {
  primarystat: 0,
  secondarystat: 1,
  tertiarystat: 2,
};

export const allAtomicStats = [...allStatNames, ...estStatNames];

export const lightStats = [...D2LightStats, ...D1LightStats];

/** compare against DimItem.bucket.hash */
export const cosmeticTypes: (BucketHashes | D1BucketHashes)[] = [
  BucketHashes.Modifications,
  BucketHashes.Emotes,
  BucketHashes.Emblems,
  BucketHashes.Vehicle,
  D1BucketHashes.Horn,
  BucketHashes.Ships,
  BucketHashes.Finishers,
];
