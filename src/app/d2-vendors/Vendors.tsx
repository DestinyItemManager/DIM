import { StateParams } from '@uirouter/angularjs';
import { IScope } from 'angular';
import {
  DestinyVendorsResponse,
  DestinyVendorGroup
  } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getVendors as getVendorsApi } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import { D2ManifestService } from '../manifest/manifest-service';
import { loadingTracker } from '../ngimport-more';
import './vendor.scss';
import { DestinyTrackerServiceType } from '../item-review/destiny-tracker.service';
import { fetchRatingsForVendors } from './vendor-ratings';
import { Subscription } from 'rxjs/Subscription';
import { D2StoreServiceType, D2Store } from '../inventory/store-types';
import Vendor from './Vendor';

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

/**
 * The "All Vendors" page for D2 that shows all the rotating vendors.
 */
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
