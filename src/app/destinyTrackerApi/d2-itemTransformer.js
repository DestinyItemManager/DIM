import _ from 'underscore';

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
   * @param {dimItem} item
   * @returns {dtrWeaponWithIdentifyingInfo}
   *
   * @memberof D2ItemTransformer
   */
  getRollAndPerks(item) {
    return {
      selectedPerks: this._getSelectedPlugs(item),
      attachedMods: this._getPowerMods(item),
      referenceId: item.hash,
      instanceId: item.id,
    };
  }

  // borrowed from d2-item-factory.service
  _getPowerMods(item) {
    const MOD_CATEGORY = 59;
    const POWER_STAT_HASH = 1935470627;

    const powerMods = item.sockets ? _.pluck(item.sockets.sockets, 'plug').filter((plug) => {
      return plug &&
        plug.itemCategoryHashes.includes(MOD_CATEGORY) &&
        plug.investmentStats.some((s) => s.statTypeHash === POWER_STAT_HASH);
    }) : null;

    return _.pluck(powerMods, 'hash');
  }

  _getSelectedPlugs(item) {
    if (!item.sockets) {
      return null;
    }

    const allPlugs = _.pluck(_.pluck(item.sockets.sockets, 'plug'), 'hash');

    return _.difference(allPlugs, this._getPowerMods(item));
  }
}

export { D2ItemTransformer };