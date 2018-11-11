import {
  DestinyItemComponentSetOfint32,
  DestinyVendorComponent,
  DestinyVendorSaleItemComponent,
  DestinyVendorDefinition,
  BungieMembershipType
} from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage from '../dim-ui/BungieImage';
import Countdown from '../dim-ui/Countdown';
import VendorItems from './VendorItems';
import './vendor.scss';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import { VendorItem } from './vendor-item';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';

interface Props {
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  vendor: DestinyVendorComponent;
  itemComponents?: DestinyItemComponentSetOfint32;
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  };
  trackerService?: DestinyTrackerService;
  ownedItemHashes?: Set<number>;
  currencyLookups: {
    [itemHash: number]: number;
  };
  account: DestinyAccount;
}

/**
 * An individual Vendor in the "all vendors" page. Use SingleVendor for a page that only has one vendor on it.
 */
export default class Vendor extends React.Component<Props> {
  render() {
    const {
      vendor,
      defs,
      buckets,
      account,
      sales,
      ownedItemHashes,
      itemComponents,
      currencyLookups
    } = this.props;

    const vendorDef = defs.Vendor.get(vendor.vendorHash);

    if (!vendorDef) {
      return null;
    }

    const vendorItems = getVendorItems(account, defs, buckets, vendorDef, itemComponents, sales);
    if (!vendorItems.length) {
      return null;
    }

    const destinationDef = defs.Destination.get(
      vendorDef.locations[vendor.vendorLocationIndex].destinationHash
    );
    const placeDef = defs.Place.get(destinationDef.placeHash);

    const placeString = [destinationDef.displayProperties.name, placeDef.displayProperties.name]
      .filter((n) => n.length)
      .join(', ');

    return (
      <div className="vendor-char-items">
        <CollapsibleTitle
          title={
            <>
              <BungieImage src={vendorDef.displayProperties.icon} className="vendor-icon" />
              <span>{vendorDef.displayProperties.name}</span>
              <span className="vendor-location">{placeString}</span>
            </>
          }
          extra={<Countdown endTime={new Date(vendor.nextRefreshDate)} />}
          sectionId={`d2vendor-${vendor.vendorHash}`}
        >
          <VendorItems
            defs={defs}
            vendor={vendor}
            vendorDef={vendorDef}
            vendorItems={vendorItems}
            ownedItemHashes={ownedItemHashes}
            currencyLookups={currencyLookups}
          />
        </CollapsibleTitle>
      </div>
    );
  }
}

export function getVendorItems(
  account: DestinyAccount,
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  vendorDef: DestinyVendorDefinition,
  itemComponents?: DestinyItemComponentSetOfint32,
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  }
) {
  if (sales && itemComponents) {
    const components = Object.values(sales);
    return components.map((component) =>
      VendorItem.forVendorSaleItem(defs, buckets, vendorDef, component, itemComponents)
    );
  } else if (vendorDef.returnWithVendorRequest) {
    // If the sales should come from the server, don't show anything until we have them
    return [];
  } else {
    return vendorDef.itemList
      .filter(
        (i) =>
          !i.exclusivity ||
          i.exclusivity === BungieMembershipType.All ||
          i.exclusivity === account.platformType
      )
      .map((i) => VendorItem.forVendorDefinitionItem(defs, buckets, i));
  }
}
