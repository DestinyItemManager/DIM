import {
  armor2PlugCategoryHashes,
  armor2PlugCategoryHashesByName,
} from 'app/search/d2-known-values';
import { activityModPlugCategoryHashes } from './mod-utils';

export const slotSpecificPlugCategoryHashes = [
  armor2PlugCategoryHashesByName.helmet,
  armor2PlugCategoryHashesByName.gauntlets,
  armor2PlugCategoryHashesByName.chest,
  armor2PlugCategoryHashesByName.leg,
  armor2PlugCategoryHashesByName.classitem,
];

export const knownModPlugCategoryHashes = [
  ...armor2PlugCategoryHashes,
  ...activityModPlugCategoryHashes,
];
