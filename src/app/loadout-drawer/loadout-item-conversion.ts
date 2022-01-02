import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { emptyArray } from 'app/utils/empty';
import _ from 'lodash';
import { DimItem } from '../inventory/item-types';
import { DimLoadoutItem, LoadoutItem } from './loadout-types';
import { findItem } from './loadout-utils';

/**
 * Turn the loadout's items into real DIM items. Any that don't exist in inventory anymore
 * are returned as warnitems.
 */
export function getItemsFromLoadoutItems(
  loadoutItems: LoadoutItem[] | undefined,
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  buckets: InventoryBuckets,
  allItems: DimItem[]
): [DimLoadoutItem[], DimLoadoutItem[]] {
  if (!loadoutItems) {
    return [emptyArray(), emptyArray()];
  }

  const items: DimLoadoutItem[] = [];
  const warnitems: DimLoadoutItem[] = [];
  for (const loadoutItem of loadoutItems) {
    const item = findItem(allItems, loadoutItem);
    if (item) {
      const copiedDimItem = _.cloneDeep(item);
      items.push({ ...copiedDimItem, socketOverrides: loadoutItem.socketOverrides });
    } else {
      const itemDef = defs.InventoryItem.get(loadoutItem.hash);
      if (itemDef) {
        const fakeItem: DimLoadoutItem =
          (defs.isDestiny2() && makeFakeItem(defs, buckets, undefined, loadoutItem.hash)) ||
          ({
            ...loadoutItem,
            icon: itemDef.displayProperties?.icon || itemDef.icon,
            name: itemDef.displayProperties?.name || itemDef.itemName,
          } as DimLoadoutItem);
        fakeItem.equipped = loadoutItem.equipped;
        fakeItem.socketOverrides = loadoutItem.socketOverrides;
        fakeItem.id = loadoutItem.id;
        warnitems.push(fakeItem);
      }
    }
  }

  return [items, warnitems];
}
