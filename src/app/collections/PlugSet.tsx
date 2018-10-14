import { DestinyItemPlug } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './collections.scss';
import { VendorItem } from '../d2-vendors/vendor-item';
import VendorItemComponent from '../d2-vendors/VendorItemComponent';
import { InventoryBuckets } from '../inventory/inventory-buckets';

/**
 * A single plug set.
 */
export default function PlugSet({
  defs,
  buckets,
  plugSetHash,
  items
}: {
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  plugSetHash: number;
  items: DestinyItemPlug[];
  ownedItemHashes?: Set<number>;
}) {
  const plugSetDef = defs.PlugSet.get(plugSetHash);

  const vendorItems = plugSetDef.reusablePlugItems.map((i) =>
    VendorItem.forPlugSetItem(
      defs,
      buckets,
      i,
      items.some((k) => k.plugItemHash === i.plugItemHash && k.enabled)
    )
  );

  return (
    <div className="vendor-char-items">
      <div className="vendor-row">
        <h3 className="category-title">{plugSetDef.displayProperties.name}</h3>
        <div className="vendor-items">
          {_.sortBy(vendorItems, (i) => i.displayProperties.name).map((item) => (
            <VendorItemComponent key={item.key} defs={defs} item={item} owned={false} />
          ))}
        </div>
      </div>
    </div>
  );
}
