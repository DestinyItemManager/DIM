import { DimItem } from "../inventory/store/d2-item-factory.service";
import { D1ItemFetchRequest, D1ItemReviewRequest } from "../item-review/destiny-tracker.service";

/**
 * Translates items from the objects that DIM has to the form that the DTR API expects.
 * This is generally tailored towards working with weapons.
 */
export class ItemTransformer {
  /**
   * Translate a DIM weapon item into the basic form that the DTR understands a weapon to contain.
   * This does not contain personally-identifying information.
   */
  translateToDtrWeapon(weapon: DimItem): D1ItemFetchRequest {
    return {
      referenceId: weapon.hash.toString(),
      roll: this._getDtrRoll(weapon)
    };
  }

  /**
   * Get the roll and perks for the selected DIM item (to send to the DTR API).
   * Will contain personally-identifying information.
   */
  getRollAndPerks(weapon: DimItem): D1ItemReviewRequest {
    return {
      roll: this._getDtrRoll(weapon),
      selectedPerks: this._getDtrPerks(weapon),
      referenceId: weapon.hash.toString(),
      instanceId: weapon.id,
    };
  }

  _getDtrPerks(weapon) {
    if (!weapon.talentGrid) {
      return null;
    }

    return weapon.talentGrid.dtrPerks;
  }

  _getDtrRoll(weapon) {
    if (!weapon.talentGrid) {
      return null;
    }

    return weapon.talentGrid.dtrRoll;
  }
}
