import { DestinyKioskItem, BungieMembershipType } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'underscore';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './collections.scss';
import VendorItems from '../d2-vendors/VendorItems';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import { VendorItem } from '../d2-vendors/vendor-item';
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';

/**
 * A single collections kiosk.
 */
// TODO: no longer used
export default function Kiosk({
  defs,
  vendorHash,
  items,
  trackerService,
  ownedItemHashes,
  account
}: {
  defs: D2ManifestDefinitions;
  vendorHash: number;
  items: DestinyKioskItem[];
  trackerService?: DestinyTrackerService;
  ownedItemHashes?: Set<number>;
  account: DestinyAccount;
}) {
  const vendorDef = defs.Vendor.get(vendorHash);

  // TODO: Some items have flavor (emblems)
  const reviewCache: D2ReviewDataCache | undefined = trackerService
    ? trackerService.getD2ReviewDataCache()
    : undefined;

  // Work around https://github.com/Bungie-net/api/issues/480
  const itemList = _.map(_.groupBy(vendorDef.itemList, (i) => i.itemHash), (l) => {
    if (l.length === 0) {
      return l[0];
    } else {
      return l.find((i) => items.some((k) => k.index === i.vendorItemIndex)) || l[0];
    }
  }).filter(
    (i) =>
      !i.exclusivity ||
      i.exclusivity === BungieMembershipType.All ||
      i.exclusivity === account.platformType
  );

  const vendorItems = itemList.map((i) =>
    VendorItem.forKioskItem(
      defs,
      vendorDef,
      i,
      items.some((k) => k.index === i.vendorItemIndex && k.canAcquire),
      reviewCache
    )
  );

  return (
    <div className="vendor-char-items">
      <VendorItems
        defs={defs}
        vendorDef={vendorDef}
        vendorItems={vendorItems}
        trackerService={trackerService}
        ownedItemHashes={ownedItemHashes}
      />
    </div>
  );
}
