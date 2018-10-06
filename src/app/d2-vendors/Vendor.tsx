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
import {
  isVerified380,
  powerLevelMatters,
  getVendorDropsForVendor
} from '../vendorEngramsXyzApi/vendorEngramsXyzService';
import vendorEngramSvg from '../../images/engram.svg';
import { t } from 'i18next';
import classNames from 'classnames';
import { VendorDrop } from '../vendorEngramsXyzApi/vendorDrops';

interface Props {
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
  allVendorEngramDrops?: VendorDrop[];
  basePowerLevel?: number;
}

/**
 * An individual Vendor in the "all vendors" page. Use SingleVendor for a page that only has one vendor on it.
 */
export default class Vendor extends React.Component<Props> {
  render() {
    const {
      vendor,
      defs,
      account,
      trackerService,
      sales,
      ownedItemHashes,
      itemComponents,
      currencyLookups,
      basePowerLevel,
      allVendorEngramDrops
    } = this.props;

    const vendorDef = defs.Vendor.get(vendor.vendorHash);

    if (!vendorDef) {
      return null;
    }

    const destinationDef = defs.Destination.get(
      vendorDef.locations[vendor.vendorLocationIndex].destinationHash
    );
    const placeDef = defs.Place.get(destinationDef.placeHash);

    const placeString = [destinationDef.displayProperties.name, placeDef.displayProperties.name]
      .filter((n) => n.length)
      .join(', ');

    const vendorEngramDrops = getVendorDropsForVendor(vendor.vendorHash, allVendorEngramDrops);
    const dropActive = vendorEngramDrops.some(isVerified380);

    const vendorEngramClass = classNames('xyz-engram', { 'xyz-active-throb': dropActive });

    const vendorLinkTitle = dropActive ? 'VendorEngramsXyz.Likely380' : 'VendorEngramsXyz.Vote';

    return (
      <div className="vendor-char-items">
        <div className="title">
          <div className="collapse-handle">
            {$featureFlags.vendorEngrams &&
              vendorEngramDrops.length > 0 &&
              powerLevelMatters(basePowerLevel) && (
                <a target="_blank" rel="noopener" href="https://vendorengrams.xyz/">
                  <img
                    className={vendorEngramClass}
                    src={vendorEngramSvg}
                    title={t(vendorLinkTitle)}
                  />
                </a>
              )}
            <BungieImage src={vendorDef.displayProperties.icon} className="vendor-icon" />
            <UISref to="destiny2.vendor" params={{ id: vendor.vendorHash }}>
              <span>{vendorDef.displayProperties.name}</span>
            </UISref>
            <span className="vendor-location">{placeString}</span>
          </div>
          <Countdown endTime={new Date(vendor.nextRefreshDate)} />
        </div>
        <VendorItems
          defs={defs}
          vendor={vendor}
          vendorDef={vendorDef}
          vendorItems={getVendorItems(
            account,
            defs,
            vendorDef,
            trackerService,
            itemComponents,
            sales
          )}
          trackerService={trackerService}
          ownedItemHashes={ownedItemHashes}
          currencyLookups={currencyLookups}
        />
      </div>
    );
  }
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
  const reviewCache: D2ReviewDataCache | undefined = trackerService
    ? trackerService.getD2ReviewDataCache()
    : undefined;

  if (sales && itemComponents) {
    const components = Object.values(sales);
    return components.map((component) =>
      VendorItem.forVendorSaleItem(defs, vendorDef, component, reviewCache, itemComponents)
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
      .map((i) => VendorItem.forVendorDefinitionItem(defs, i, reviewCache));
  }
}
