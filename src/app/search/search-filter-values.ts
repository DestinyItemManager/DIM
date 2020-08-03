import { DamageType } from 'bungie-api-ts/destiny2';
import { D1LightStats } from './d1-known-values';
import {
  D2ArmorStatHashByName,
  D2LightStats,
  D2WeaponStatHashByName,
  TOTAL_STAT_HASH,
  CUSTOM_TOTAL_STAT_HASH,
} from './d2-known-values';

// ✨ magic values ✨
// this file has non-programatically decided information
// hashes, names, & enums, hand-crafted and chosen by us

// this correlation is solely for element filter names
export const damageNamesByEnum: { [key in DamageType]: string | null } = {
  0: null,
  1: 'kinetic',
  2: 'arc',
  3: 'solar',
  4: 'void',
  5: 'raid',
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
export const searchableStatNames = [...Object.keys(dimArmorStatHashByName), 'any'];

/** armor stat hashes to check for the "any" keyword */
export const armorAnyStatHashes = Object.values(D2ArmorStatHashByName);

/** stat hashes to calculate max values for */
export const armorStatHashes = Object.values(dimArmorStatHashByName);

/** all-stat table, for looking up stat hashes given a queried stat name */
export const statHashByName = {
  ...D2WeaponStatHashByName,
  ...dimArmorStatHashByName,
};

/** all-stat list, to generate filters from */
export const allStatNames = [...Object.keys(statHashByName), 'any'];

export const lightStats = [...D2LightStats, ...D1LightStats];

/** compare against DimItem.type in EN */
export const cosmeticTypes = [
  'Shader',
  'Shaders',
  'Ornaments',
  'Modifications',
  'Emote',
  'Emotes',
  'Emblem',
  'Emblems',
  'Vehicle',
  'Horn',
  'Ship',
  'Ships',
  'ClanBanners',
  'Finishers',
];
