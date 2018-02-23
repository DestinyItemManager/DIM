import * as _ from 'underscore';
import { DtrItem } from '../item-review/destiny-tracker.service';
import { DimItem } from '../inventory/store/d2-item-factory.service';

/**
 * Translates items from the objects that DIM has to the form that the DTR API expects.
 * This is generally tailored towards working with weapons.
 * Also tailored for the Destiny 2 version.
 */
class D2ItemTransformer {
  /**
   * Translate a DIM item into the basic form that the DTR understands an item to contain.
   * This does not contain personally-identifying information.
   * Meant for fetch calls.
   */
  translateToDtrItem(item: DimItem): DtrItem {
    return {
      referenceId: item.hash
    };
  }

  /**
   * Get the roll and perks for the selected DIM item (to send to the DTR API).
   * Will contain personally-identifying information.
   */
  getRollAndPerks(item: DimItem): DtrItem {
    return {
      selectedPerks: this._getSelectedPlugs(item),
      attachedMods: this._getPowerMods(item),
      referenceId: item.hash,
      instanceId: item.id,
    };
  }

  // borrowed from d2-item-factory.service
  _getPowerMods(item: DimItem) {
    const MOD_CATEGORY = 59;
    const POWER_STAT_HASH = 1935470627;

    const powerMods = item.sockets ? _.pluck(item.sockets.sockets, 'plug').filter((plug) => {
      return plug && plug.itemCategoryHashes && plug.investmentStats &&
        plug.itemCategoryHashes.includes(MOD_CATEGORY) &&
        plug.investmentStats.some((s) => s.statTypeHash === POWER_STAT_HASH);
    }) : null;

    if (!powerMods) {
      return [];
    }

    return _.pluck(powerMods, 'hash');
  }

  _getSelectedPlugs(item: DimItem) {
    if (!item.sockets) {
      return null;
    }

    const allPlugs = _.compact(_.pluck(_.pluck(item.sockets.sockets, 'plug'), 'hash'));

    return _.difference(allPlugs, this._getPowerMods(item));
  }
}

export { D2ItemTransformer };
