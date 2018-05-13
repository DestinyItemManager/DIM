import { StateParams } from '@uirouter/angularjs';
import { IScope } from 'angular';
import {
  DestinyItemComponentSetOfint32,
  DestinyVendorComponent,
  DestinyVendorSaleItemComponent,
  DestinyVendorsResponse,
  DestinyVendorGroup,
  DestinyVendorDefinition,
  BungieMembershipType
  } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getVendors as getVendorsApi } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import { BungieImage } from '../dim-ui/bungie-image';
import Countdown from '../dim-ui/countdown';
import { D2ManifestService } from '../manifest/manifest-service';
import VendorItems from './vendor-items';
import { $state, loadingTracker } from '../ngimport-more';
import './vendor.scss';
import { DestinyTrackerServiceType } from '../item-review/destiny-tracker.service';
import { fetchRatingsForVendors } from './vendor-ratings';
import { Subscription } from 'rxjs/Subscription';
import { D2StoreServiceType, D2Store } from '../inventory/store-types';
import { VendorItem } from './vendor-item';
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';

interface Props {
  $scope: IScope;
  $stateParams: StateParams;
  account: DestinyAccount;
  D2StoresService: D2StoreServiceType;
  dimDestinyTrackerService: DestinyTrackerServiceType;
}

interface State {
  defs?: D2ManifestDefinitions;
  vendorsResponse?: DestinyVendorsResponse;
  trackerService?: DestinyTrackerServiceType;
  stores?: D2Store[];
  ownedItemHashes?: Set<number>;
}

export default class Vendors extends React.Component<Props, State> {
  private storesSubscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  // TODO: pull this into a service?
  async loadVendors() {
    // TODO: defs as a property, not state
    const defs = await getDefinitions();
    this.props.$scope.$apply(() => {
      D2ManifestService.isLoaded = true;
    });

    // TODO: get for all characters, or let people select a character? This is a hack
    // we at least need to display that character!
    let characterId: string = this.props.$stateParams.characterId;
    if (!characterId) {
      const stores = this.state.stores || await this.props.D2StoresService.getStoresStream(this.props.account).take(1).toPromise();
      if (stores) {
        characterId = stores.find((s) => s.current)!.id;
      }
    }
    const vendorsResponse = await getVendorsApi(this.props.account, characterId);

    this.setState({ defs, vendorsResponse });

    const trackerService = await fetchRatingsForVendors(defs, this.props.dimDestinyTrackerService, vendorsResponse);
    this.setState({ trackerService });
  }

  componentDidMount() {
    const promise = this.loadVendors();
    loadingTracker.addPromise(promise);

    this.props.$scope.$on('dim-refresh', () => {
      const promise = this.loadVendors();
      loadingTracker.addPromise(promise);
    });

    this.storesSubscription = this.props.D2StoresService.getStoresStream(this.props.account).subscribe((stores) => {
      if (stores) {
        const ownedItemHashes = new Set<number>();
        for (const store of stores) {
          for (const item of store.items) {
            ownedItemHashes.add(item.hash);
          }
        }
        this.setState({ stores, ownedItemHashes });
      }
    });
  }

  componentWillUnmount() {
    this.storesSubscription.unsubscribe();
  }

  render() {
    const { defs, vendorsResponse, trackerService, ownedItemHashes } = this.state;
    const { account } = this.props;

    if (!vendorsResponse || !defs) {
      // TODO: loading component!
      return <div className="vendor dim-page"><i className="fa fa-spinner fa-spin"/></div>;
    }

    return (
      <div className="vendor d2-vendors dim-page">
        {Object.values(vendorsResponse.vendorGroups.data.groups).map((group) =>
          <VendorGroup
            key={group.vendorGroupHash}
            defs={defs}
            group={group}
            vendorsResponse={vendorsResponse}
            trackerService={trackerService}
            ownedItemHashes={ownedItemHashes}
            account={account}
          />
        )}

      </div>
    );
  }
}

function VendorGroup({
  defs,
  group,
  vendorsResponse,
  trackerService,
  ownedItemHashes,
  account
}: {
  defs: D2ManifestDefinitions;
  group: DestinyVendorGroup;
  vendorsResponse: DestinyVendorsResponse;
  trackerService?: DestinyTrackerServiceType;
  ownedItemHashes?: Set<number>;
  account: DestinyAccount;
}) {
  const groupDef = defs.VendorGroup.get(group.vendorGroupHash);
  return (
    <>
      <h2>{groupDef.categoryName}</h2>
      {group.vendorHashes.map((h) => vendorsResponse.vendors.data[h]).map((vendor) =>
        <Vendor
          key={vendor.vendorHash}
          account={account}
          defs={defs}
          vendor={vendor}
          itemComponents={vendorsResponse.itemComponents[vendor.vendorHash]}
          sales={vendorsResponse.sales.data[vendor.vendorHash] && vendorsResponse.sales.data[vendor.vendorHash].saleItems}
          trackerService={trackerService}
          ownedItemHashes={ownedItemHashes}
          currencyLookups={vendorsResponse.currencyLookups.data.itemQuantities}
        />
      )}
    </>
  );
}

function Vendor({
  defs,
  vendor,
  itemComponents,
  sales,
  trackerService,
  ownedItemHashes,
  currencyLookups,
  account
}: {
  defs: D2ManifestDefinitions;
  vendor: DestinyVendorComponent;
  itemComponents?: DestinyItemComponentSetOfint32;
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  };
  trackerService?: DestinyTrackerServiceType;
  ownedItemHashes?: Set<number>;
  currencyLookups: {
    [itemHash: number]: number;
  };
  account: DestinyAccount;
}) {
  const vendorDef = defs.Vendor.get(vendor.vendorHash);
  if (!vendorDef) {
    return null;
  }

  const destinationDef = defs.Destination.get(vendorDef.locations[vendor.vendorLocationIndex].destinationHash);
  const placeDef = defs.Place.get(destinationDef.placeHash);

  const placeString = [destinationDef.displayProperties.name, placeDef.displayProperties.name].filter((n) => n.length).join(', ');

  const click = () => $state.go('destiny2.vendor', { id: vendor.vendorHash });

  return (
    <div className="vendor-char-items">
      <div className="title">
        <div className="collapse-handle">
          <BungieImage src={vendorDef.displayProperties.icon} className="vendor-icon"/>
          <span onClick={click}>{vendorDef.displayProperties.name}</span>
          <span className="vendor-location">{placeString}</span>
        </div>
        <Countdown endTime={new Date(vendor.nextRefreshDate)}/>
      </div>
      <VendorItems
        defs={defs}
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
  trackerService?: DestinyTrackerServiceType,
  itemComponents?: DestinyItemComponentSetOfint32,
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  }
) {
  const reviewCache: D2ReviewDataCache | undefined = trackerService ? trackerService.getD2ReviewDataCache() : undefined;

  if (sales && itemComponents) {
    const components = Object.values(sales);
    return components.map((component) => new VendorItem(
      defs,
      vendorDef,
      vendorDef.itemList[component.vendorItemIndex],
      reviewCache,
      component,
      itemComponents
    ));
  } else if (vendorDef.returnWithVendorRequest) {
    // If the sales should come from the server, don't show anything until we have them
    return [];
  } else {
    return vendorDef.itemList.filter((i) =>
      !i.exclusivity ||
      i.exclusivity === BungieMembershipType.All ||
      i.exclusivity === account.platformType
    ).map((i) => new VendorItem(defs, vendorDef, i, reviewCache));
  }
}
