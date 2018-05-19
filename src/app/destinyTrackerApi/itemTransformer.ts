import { D1Item } from "../inventory/item-types";
import { D1ItemFetchRequest, D1ItemReviewRequest } from "../item-review/d1-dtr-api-types";

/**
 * Translates items from the objects that DIM has to the form that the DTR API expects.
 * This is generally tailored towards working with weapons.
 */
export class ItemTransformer {
  /**
   * Translate a DIM weapon item into the basic form that the DTR understands a weapon to contain.
   * This does not contain personally-identifying information.
   */
  translateToDtrWeapon(weapon: D1Item): D1ItemFetchRequest {
    return {
      referenceId: weapon.hash.toString(),
      roll: this._getDtrRoll(weapon)
    };
  }

  /**
   * Get the roll and perks for the selected DIM item (to send to the DTR API).
   * Will contain personally-identifying information.
   */
  getRollAndPerks(weapon: D1Item): D1ItemReviewRequest {
    return {
      roll: this._getDtrRoll(weapon),
      selectedPerks: this._getDtrPerks(weapon),
      referenceId: weapon.hash.toString(),
      instanceId: weapon.id,
    };
  }

  _getDtrPerks(weapon: D1Item): string | null {
    if (!weapon.talentGrid) {
      return null;
    }

    return weapon.talentGrid.dtrPerks;
  }

  _getDtrRoll(weapon: D1Item): string | null {
    if (!weapon.talentGrid) {
      return null;
    }

    return weapon.talentGrid.dtrRoll;
  }
}
