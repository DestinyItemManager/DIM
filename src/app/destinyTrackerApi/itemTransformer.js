/**
 * Translates items from the objects that DIM has to the form that the DTR API expects.
 * This is generally tailored towards working with weapons.
 *
 * @class ItemTransformer
 */
class ItemTransformer {
  /**
   * Translate a DIM weapon item into the basic form that the DTR understands a weapon to contain.
   * This does not contain personally-identifying information.
   *
   * @param {dimItem} weapon
   * @returns {dtrWeapon}
   *
   * @memberof ItemTransformer
   */
  translateToDtrWeapon(weapon) {
    return {
      referenceId: weapon.hash,
      roll: this._getDtrRoll(weapon)
    };
  }

  /**
   * Get the roll and perks for the selected DIM item (to send to the DTR API).
   * Will contain personally-identifying information.
   *
   * @param {dimItem} weapon
   * @returns {dtrWeaponWithIdentifyingInfo}
   *
   * @memberof ItemTransformer
   */
  getRollAndPerks(weapon) {
    return {
      roll: this._getDtrRoll(weapon),
      selectedPerks: this._getDtrPerks(weapon),
      referenceId: weapon.hash,
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

export { ItemTransformer };