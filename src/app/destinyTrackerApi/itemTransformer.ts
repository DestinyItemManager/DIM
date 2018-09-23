import { D1Item } from '../inventory/item-types';
import { D1ItemFetchRequest, D1ItemReviewRequest } from '../item-review/d1-dtr-api-types';

/**
 * Translate a DIM weapon item into the basic form that the DTR understands a weapon to contain.
 * This does not contain personally-identifying information.
 */
export function translateToDtrWeapon(weapon: D1Item): D1ItemFetchRequest {
  return {
    referenceId: weapon.hash.toString(),
    roll: getDtrRoll(weapon)
  };
}

/**
 * Get the roll and perks for the selected DIM item (to send to the DTR API).
 * Will contain personally-identifying information.
 */
export function getRollAndPerks(weapon: D1Item): D1ItemReviewRequest {
  return {
    ...translateToDtrWeapon(weapon),
    selectedPerks: getDtrPerks(weapon),
    instanceId: weapon.id
  };
}

function getDtrPerks(weapon: D1Item): string | null {
  return weapon.talentGrid ? weapon.talentGrid.dtrPerks : null;
}

function getDtrRoll(weapon: D1Item): string | null {
  return weapon.talentGrid ? weapon.talentGrid.dtrRoll : null;
}
