import * as _ from 'underscore';
import { DtrItem } from '../item-review/destiny-tracker.service';
import { compact } from '../util';
import { DestinyVendorSaleItemComponent } from 'bungie-api-ts/destiny2';
import { D2Item } from '../inventory/item-types';
import { getPowerMods } from '../inventory/store/d2-item-factory.service';

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
  translateToDtrItem(item: D2Item | DestinyVendorSaleItemComponent): DtrItem {
    return {
      referenceId: ((item as DestinyVendorSaleItemComponent).itemHash !== undefined) ? (item as DestinyVendorSaleItemComponent).itemHash : (item as D2Item).hash
    };
  }

  /**
   * Get the roll and perks for the selected DIM item (to send to the DTR API).
   * Will contain personally-identifying information.
   */
  getRollAndPerks(item: D2Item): DtrItem {
    const powerModHashes = getPowerMods(item).map((m) => m.hash);
    return {
      selectedPerks: this._getSelectedPlugs(item, powerModHashes),
      attachedMods: powerModHashes,
      referenceId: item.hash,
      instanceId: item.id,
    };
  }

  _getSelectedPlugs(item: D2Item, powerModHashes: number[]) {
    if (!item.sockets) {
      return [];
    }

    const allPlugs = compact(item.sockets.sockets.map((i) => i.plug).map((i) => i && i.plugItem.hash));

    return _.difference(allPlugs, powerModHashes);
  }
}

export { D2ItemTransformer };
