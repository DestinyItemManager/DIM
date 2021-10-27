import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import LockedModIcon from 'app/loadout/loadout-ui/LockedModIcon';
import { getModRenderKey } from 'app/loadout/mod-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import React from 'react';
import LoadoutDrawerItem from './LoadoutDrawerItem';

export default function SavedSubclass({
  bucket,
  subclass,
  plugs,
  equip,
  remove,
  onPlugClicked,
}: {
  bucket: InventoryBucket | undefined;
  subclass: DimItem;
  plugs: PluggableInventoryItemDefinition[];
  equip(item: DimItem, e: React.MouseEvent): void;
  remove(item: DimItem, e: React.MouseEvent): void;
  onPlugClicked(plug: PluggableInventoryItemDefinition): void;
}) {
  const defs = useD2Definitions();
  const subclassDef = subclass && defs?.InventoryItem.get(subclass.hash);

  if (!subclass || !bucket || !subclassDef) {
    return null;
  }

  //todo do abilities, fragments and aspects
  const plugKeys = {};
  return (
    <div>
      <div>{bucket.name}</div>
      <div style={{ display: 'flex' }}>
        <LoadoutDrawerItem item={subclass} equip={equip} remove={remove} />
        {plugs.map((plug) => (
          <LockedModIcon
            key={getModRenderKey(plug, plugKeys)}
            mod={plug}
            onModClicked={() => onPlugClicked(plug)}
          />
        ))}
      </div>
    </div>
  );
}
