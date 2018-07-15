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
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';
import { UISref } from '@uirouter/react';
import { VendorEngramsXyzService } from '../vendorEngramsXyzApi/vendorEngramsXyzService';
import { VendorDropType } from '../vendorEngramsXyzApi/vendorDrops';
import classNames from 'classnames';

/**
 * An individual Vendor in the "all vendors" page. Use SingleVendor for a page that only has one vendor on it.
 */
export default function Vendor({
  defs,
  vendor,
  itemComponents,
  sales,
  trackerService,
  ownedItemHashes,
  currencyLookups,
  account,
  vendorEngramsService
}: {
  defs: D2ManifestDefinitions;
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
  vendorEngramsService?: VendorEngramsXyzService;
}) {
  const vendorDef = defs.Vendor.get(vendor.vendorHash);
  if (!vendorDef) {
    return null;
  }

  const destinationDef = defs.Destination.get(vendorDef.locations[vendor.vendorLocationIndex].destinationHash);
  const placeDef = defs.Place.get(destinationDef.placeHash);

  const placeString = [destinationDef.displayProperties.name, placeDef.displayProperties.name].filter((n) => n.length).join(', ');

  const dropActive = (vendorEngramsService && vendorEngramsService
    .getVendorDrop(vendor.vendorHash)
    .then((vd) => vd && vd.type === VendorDropType.Likely380));

  console.log(vendor.vendorHash);
  if (vendorEngramsService) {
    console.log(vendorEngramsService.getVendorDrop(vendor.vendorHash));
  }
  console.log(dropActive);

  const titleWithDrops = classNames('title',
    { 'xyz-drop-active': dropActive });

  return (
    <div className="vendor-char-items">
      <div className={titleWithDrops}>
        <div className="collapse-handle">
          <BungieImage src={vendorDef.displayProperties.icon} className="vendor-icon"/>
          <UISref to='destiny2.vendor' params={{ id: vendor.vendorHash }}><span>{vendorDef.displayProperties.name}</span></UISref>
          <span className="vendor-location">{placeString}</span>
        </div>
        <Countdown endTime={new Date(vendor.nextRefreshDate)}/>
      </div>
      <VendorItems
        defs={defs}
        vendor={vendor}
        vendorDef={vendorDef}
        vendorItems={getVendorItems(account, defs, vendorDef, trackerService, itemComponents, sales)}
        trackerService={trackerService}
        ownedItemHashes={ownedItemHashes}
        currencyLookups={currencyLookups}
      />
    </div>
  );
}

export function getVendorItems(
  account: DestinyAccount,
  defs: D2ManifestDefinitions,
  vendorDef: DestinyVendorDefinition,
  trackerService?: DestinyTrackerService,
  itemComponents?: DestinyItemComponentSetOfint32,
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  }
) {
  const reviewCache: D2ReviewDataCache | undefined = trackerService ? trackerService.getD2ReviewDataCache() : undefined;

  if (sales && itemComponents) {
    const components = Object.values(sales);
    return components.map((component) => VendorItem.forVendorSaleItem(
      defs,
      vendorDef,
      component,
      reviewCache,
      itemComponents,
    ));
  } else if (vendorDef.returnWithVendorRequest) {
    // If the sales should come from the server, don't show anything until we have them
    return [];
  } else {
    return vendorDef.itemList.filter((i) =>
      !i.exclusivity ||
      i.exclusivity === BungieMembershipType.All ||
      i.exclusivity === account.platformType
    ).map((i) => VendorItem.forVendorDefinitionItem(defs, i, reviewCache));
  }
}
