import { DestinyItemPlug } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './collections.scss';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import { VendorItem } from '../d2-vendors/vendor-item';
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';
import VendorItemComponent from '../d2-vendors/VendorItemComponent';
import { InventoryBuckets } from '../inventory/inventory-buckets';

/**
 * A single plug set.
 */
export default function PlugSet({
  defs,
  buckets,
  plugSetHash,
  items,
  trackerService
}: {
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  plugSetHash: number;
  items: DestinyItemPlug[];
  trackerService?: DestinyTrackerService;
  ownedItemHashes?: Set<number>;
}) {
  const plugSetDef = defs.PlugSet.get(plugSetHash);

  const reviewCache: D2ReviewDataCache | undefined = trackerService
    ? trackerService.getD2ReviewDataCache()
    : undefined;

  const vendorItems = plugSetDef.reusablePlugItems.map((i) =>
    VendorItem.forPlugSetItem(
      defs,
      buckets,
      i,
      reviewCache,
      items.some((k) => k.plugItemHash === i.plugItemHash && k.enabled)
    )
  );

  return (
    <div className="vendor-char-items">
      <div className="vendor-row">
        <h3 className="category-title">{plugSetDef.displayProperties.name}</h3>
        <div className="vendor-items">
          {_.sortBy(vendorItems, (i) => i.displayProperties.name).map((item) => (
            <VendorItemComponent
              key={item.key}
              defs={defs}
              item={item}
              trackerService={trackerService}
              owned={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
