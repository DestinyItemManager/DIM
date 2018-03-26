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
import { getBasicProfile, getVendors as getVendorsApi } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import { BungieImage } from '../dim-ui/bungie-image';
import Countdown from '../dim-ui/countdown';
import { StoreServiceType } from '../inventory/d2-stores.service';
import { D2ManifestService } from '../manifest/manifest-service';
import VendorItems from './vendor-items';
import { $state, loadingTracker } from '../ngimport-more';
import './vendor.scss';
import { DestinyTrackerServiceType } from '../item-review/destiny-tracker.service';
import { fetchRatings } from './vendor-ratings';

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
}

export default class Vendors extends React.Component<Props, State> {
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
    let characterId = this.props.$stateParams.characterId;
    if (!characterId) {
      // uggggh
      // TODO: maybe load the whole stores anyway so we can count currencies and such, a la the old thing
      const activeStore = this.props.D2StoresService.getActiveStore();
      characterId = activeStore
        ? activeStore.id
        : (await getBasicProfile(this.props.account)).profile.data.characterIds[0];
    }
    const vendorsResponse = await getVendorsApi(this.props.account, characterId);

    this.setState({ defs, vendorsResponse });

    const trackerService = await fetchRatings(defs, this.props.dimDestinyTrackerService, vendorsResponse);
    this.setState({ trackerService });
  }

  componentDidMount() {
    const promise = this.loadVendors();
    loadingTracker.addPromise(promise);

    this.props.$scope.$on('dim-refresh', () => {
      const promise = this.loadVendors();
      loadingTracker.addPromise(promise);
    });
  }

  render() {
    const { defs, vendorsResponse, trackerService } = this.state;

    if (!vendorsResponse || !defs) {
      // TODO: loading component!
      return <div className="vendor dim-page"><i className="fa fa-spinner fa-spin"/></div>;
    }

    return (
      <div className="vendor d2-vendors dim-page">
        <div className="under-construction">This feature is a preview - we're still working on it!</div>
        {Object.values(vendorsResponse.vendorGroups.data.groups).map((group) =>
          <VendorGroup key={group.vendorGroupHash} defs={defs} group={group} vendorsResponse={vendorsResponse} trackerService={trackerService}/>
        )}

      </div>
    );
  }
}

function VendorGroup({
  defs,
  group,
  vendorsResponse,
  trackerService
}: {
  defs: D2ManifestDefinitions;
  group: DestinyVendorGroup;
  vendorsResponse: DestinyVendorsResponse;
  trackerService?: DestinyTrackerServiceType;
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
  trackerService
}: {
  defs: D2ManifestDefinitions;
  vendor: DestinyVendorComponent;
  itemComponents?: DestinyItemComponentSetOfint32;
  sales?: {
    [key: string]: DestinyVendorSaleItemComponent;
  };
  trackerService?: DestinyTrackerServiceType;
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
      />
    </div>
  );
}
