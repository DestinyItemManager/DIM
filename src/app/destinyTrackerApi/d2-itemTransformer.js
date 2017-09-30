/**
 * Translates items from the objects that DIM has to the form that the DTR API expects.
 * This is generally tailored towards working with weapons.
 * Also tailored for the Destiny 2 version.
 *
 * @class D2ItemTransformer
 */
class D2ItemTransformer {
  /**
   * Translate a DIM item into the basic form that the DTR understands an item to contain.
   * This does not contain personally-identifying information.
   * Meant for fetch calls.
   *
   * @param {dimItem} item
   * @returns {dtrWeapon}
   *
   * @memberof D2ItemTransformer
   */
  translateToDtrItem(item) {
    return {
      referenceId: item.hash
    };
  }

  /**
   * Get the roll and perks for the selected DIM item (to send to the DTR API).
   * Will contain personally-identifying information.
   *
   * @param {dimItem} weapon
   * @returns {dtrWeaponWithIdentifyingInfo}
   *
   * @memberof D2ItemTransformer
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

export { D2ItemTransformer };