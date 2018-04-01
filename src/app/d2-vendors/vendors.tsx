import { StateParams } from '@uirouter/angularjs';
import { IScope } from 'angular';
import {
  DestinyItemComponentSetOfint32,
  DestinyVendorComponent,
  DestinyVendorSaleItemComponent,
  DestinyVendorsResponse,
  DestinyVendorGroup
  } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getVendors as getVendorsApi } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import { BungieImage } from '../dim-ui/bungie-image';
import Countdown from '../dim-ui/countdown';
import { StoreServiceType } from '../inventory/d2-stores.service';
import { D2ManifestService } from '../manifest/manifest-service';
import VendorItems from './vendor-items';
import { $state, loadingTracker } from '../ngimport-more';
import './vendor.scss';
import { DestinyTrackerServiceType } from '../item-review/destiny-tracker.service';
import { fetchRatingsForVendors } from './vendor-ratings';
import { Subscription } from 'rxjs/Subscription';
import { DimStore } from '../inventory/store/d2-store-factory.service';

interface Props {
  $scope: IScope;
  $stateParams: StateParams;
  account: DestinyAccount;
  D2StoresService: StoreServiceType;
  dimDestinyTrackerService: DestinyTrackerServiceType;
}

interface State {
  defs?: D2ManifestDefinitions;
  vendorsResponse?: DestinyVendorsResponse;
  trackerService?: DestinyTrackerServiceType;
  stores?: DimStore[];
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
      characterId = stores.find((s) => s.current)!.id;
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

    if (!vendorsResponse || !defs) {
      // TODO: loading component!
      return <div className="vendor dim-page"><i className="fa fa-spinner fa-spin"/></div>;
    }

    return (
      <div className="vendor d2-vendors dim-page">
        <div className="under-construction">This feature is a preview - we're still working on it!</div>
        {Object.values(vendorsResponse.vendorGroups.data.groups).map((group) =>
          <VendorGroup
            key={group.vendorGroupHash}
            defs={defs}
            group={group}
            vendorsResponse={vendorsResponse}
            trackerService={trackerService}
            ownedItemHashes={ownedItemHashes}
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
  ownedItemHashes
}: {
  defs: D2ManifestDefinitions;
  group: DestinyVendorGroup;
  vendorsResponse: DestinyVendorsResponse;
  trackerService?: DestinyTrackerServiceType;
  ownedItemHashes?: Set<number>;
}) {
  const groupDef = defs.VendorGroup.get(group.vendorGroupHash);
  return (
    <>
      <h2>{groupDef.categoryName}</h2>
      {group.vendorHashes.map((h) => vendorsResponse.vendors.data[h]).map((vendor) =>
        <Vendor
          key={vendor.vendorHash}
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
  currencyLookups
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
        sales={sales}
        itemComponents={itemComponents}
        trackerService={trackerService}
        ownedItemHashes={ownedItemHashes}
        currencyLookups={currencyLookups}
      />
    </div>
  );
}
