import { D1ItemFetchRequest, D1ItemReviewRequest } from "../item-review/destiny-tracker.service";
import { DimItem } from "../inventory/item-types";

/**
 * Translate a DIM weapon item into the basic form that the DTR understands a weapon to contain.
 * This does not contain personally-identifying information.
 */
export function translateToDtrWeapon(weapon: DimItem): D1ItemFetchRequest {
  return {
    referenceId: weapon.hash.toString(),
    roll: getDtrRoll(weapon)
  };
}

/**
 * Get the roll and perks for the selected DIM item (to send to the DTR API).
 * Will contain personally-identifying information.
 */
export function getRollAndPerks(weapon: DimItem): D1ItemReviewRequest {
  return {
    roll: getDtrRoll(weapon),
    selectedPerks: getDtrPerks(weapon),
    referenceId: weapon.hash.toString(),
    instanceId: weapon.id,
  };
}

function getDtrPerks(weapon) {
  if (!weapon.talentGrid) {
    return null;
  }

  return weapon.talentGrid.dtrPerks;
}

function getDtrRoll(weapon) {
  if (!weapon.talentGrid) {
    return null;
  }

  return weapon.talentGrid.dtrRoll;
}
