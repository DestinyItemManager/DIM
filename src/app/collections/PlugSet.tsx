import {
  DestinyItemPlug
} from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'underscore';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './collections.scss';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import { VendorItem } from '../d2-vendors/vendor-item';
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';
import VendorItemComponent from '../d2-vendors/VendorItemComponent';

/**
 * A single plug set.
 */
export default function PlugSet({
  defs,
  plugSetHash,
  items,
  trackerService
}: {
  defs: D2ManifestDefinitions;
  plugSetHash: number;
  items: DestinyItemPlug[];
  trackerService?: DestinyTrackerService;
  ownedItemHashes?: Set<number>;
}) {
  const plugSetDef = defs.PlugSet.get(plugSetHash);

  const reviewCache: D2ReviewDataCache | undefined = trackerService ? trackerService.getD2ReviewDataCache() : undefined;

  const vendorItems = plugSetDef.reusablePlugItems.map((i) => VendorItem.forPlugSetItem(defs, i, reviewCache, items.some((k) => k.plugItemHash === i.plugItemHash && k.enabled)));

  return (
    <div className="vendor-char-items">
      <div className="vendor-row">
        <h3 className="category-title">{defs.InventoryItem.get(plugSetDef.reusablePlugItems[0].plugItemHash).itemTypeDisplayName}</h3>
        <div className="vendor-items">
        {_.sortBy(vendorItems, (i) => i.displayProperties.name).map((item) =>
          <VendorItemComponent
            key={item.key}
            defs={defs}
            item={item}
            trackerService={trackerService}
            owned={false}
          />
        )}
        </div>
      </div>
    </div>
  );
}
