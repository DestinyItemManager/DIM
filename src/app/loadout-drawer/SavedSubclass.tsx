import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import _ from 'lodash';
import React from 'react';
import { LoadoutItem } from './loadout-types';
import LoadoutDrawerItem from './LoadoutDrawerItem';

export default function SavedSubclass({
  bucket,
  loadoutItems,
  items,
  equip,
  remove,
}: {
  bucket: InventoryBucket | undefined;
  loadoutItems: LoadoutItem[];
  items: DimItem[];
  equip(item: DimItem, e: React.MouseEvent): void;
  remove(item: DimItem, e: React.MouseEvent): void;
}) {
  const defs = useD2Definitions();
  const possibleSubclasses = _.compact(
    loadoutItems.map((loadoutItem) =>
      items.find((item) => item.id === loadoutItem.id && item.hash === loadoutItem.hash)
    )
  );
  const subclass = possibleSubclasses.length && possibleSubclasses[0];
  const subclassDef = subclass && defs?.InventoryItem.get(subclass.hash);

  if (!subclass || !bucket || !subclassDef) {
    return null;
  }

  //todo do abilities, fragments and aspects

  return (
    <div>
      <div>{bucket.name}</div>
      <LoadoutDrawerItem item={subclass} equip={equip} remove={remove} />
    </div>
  );
}
