import { Loadout } from 'app/loadout-drawer/loadout-types';
import { isClassCompatible } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';

// Circular selectors edition #4

export function filterLoadoutsToClass(loadouts: Loadout[], classType: DestinyClass) {
  return loadouts.filter((loadout) => isClassCompatible(loadout.classType, classType));
}
