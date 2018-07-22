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
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import { fetchRatingsForVendors } from './vendor-ratings';
import { Subscription } from 'rxjs/Subscription';
import { D2Store } from '../inventory/store-types';
import Vendor from './Vendor';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService } from '../inventory/d2-stores.service';
import { UIViewInjectedProps } from '@uirouter/react';
import { $rootScope } from 'ngimport';
import { Loading } from '../dim-ui/Loading';
import { VendorEngramsXyzService, dimVendorEngramsService } from '../vendorEngramsXyzApi/vendorEngramsXyzService';

interface Props {
  account: DestinyAccount;
}

interface State {
  defs?: D2ManifestDefinitions;
  vendorsResponse?: DestinyVendorsResponse;
  trackerService?: DestinyTrackerService;
  stores?: D2Store[];
  ownedItemHashes?: Set<number>;
  vendorEngramsService?: VendorEngramsXyzService;
  basePowerLevel?: number;
}

/**
 * The "All Vendors" page for D2 that shows all the rotating vendors.
 */
export default class Vendors extends React.Component<Props & UIViewInjectedProps, State> {
  private storesSubscription: Subscription;
  private $scope = $rootScope.$new(true);

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  // TODO: pull this into a service?
  async loadVendors() {
    // TODO: defs as a property, not state
    const defs = await getDefinitions();
    D2ManifestService.loaded = true;

    // TODO: get for all characters, or let people select a character? This is a hack
    // we at least need to display that character!
    let characterId: string = this.props.transition!.params().characterId;
    if (!characterId) {
      const stores = this.state.stores || await D2StoresService.getStoresStream(this.props.account).take(1).toPromise();
      if (stores) {
        characterId = stores.find((s) => s.current)!.id;

        const maxBasePower = stores.find((s) => s.current)!.stats.maxBasePower;

        if (maxBasePower) {
          const basePowerLevel = maxBasePower.tierMax;
          this.setState({ basePowerLevel });
        }
      }
    }
    const vendorsResponse = await getVendorsApi(this.props.account, characterId);

    this.setState({ defs, vendorsResponse });

    const trackerService = await fetchRatingsForVendors(defs, vendorsResponse);
    this.setState({ trackerService });

    const vendorEngramsService = await dimVendorEngramsService.fetchVendorDrops();
    this.setState({ vendorEngramsService });
  }

  componentDidMount() {
    const promise = this.loadVendors();
    loadingTracker.addPromise(promise);

    this.$scope.$on('dim-refresh', () => {
      const promise = this.loadVendors();
      loadingTracker.addPromise(promise);
    });

    this.storesSubscription = D2StoresService.getStoresStream(this.props.account).subscribe((stores) => {
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
    this.$scope.$destroy();
  }

  render() {
    const { defs, vendorsResponse, trackerService, ownedItemHashes, vendorEngramsService, basePowerLevel } = this.state;
    const { account } = this.props;

    if (!vendorsResponse || !defs) {
      return <div className="vendor dim-page"><Loading/></div>;
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
            vendorEngramsService={vendorEngramsService}
            basePowerLevel={basePowerLevel}
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
  account,
  vendorEngramsService,
  basePowerLevel
}: {
  defs: D2ManifestDefinitions;
  group: DestinyVendorGroup;
  vendorsResponse: DestinyVendorsResponse;
  trackerService?: DestinyTrackerService;
  ownedItemHashes?: Set<number>;
  account: DestinyAccount;
  vendorEngramsService?: VendorEngramsXyzService;
  basePowerLevel?: number;
}) {
  const groupDef = defs.VendorGroup.get(group.vendorGroupHash);
  return (
    <>
      <h2>{groupDef.categoryName}</h2>
      {group.vendorHashes.map((h) => vendorsResponse.vendors.data[h]).map((vendor) =>
        <ErrorBoundary key={vendor.vendorHash} name="Vendor">
          <Vendor
            account={account}
            defs={defs}
            vendor={vendor}
            itemComponents={vendorsResponse.itemComponents[vendor.vendorHash]}
            sales={vendorsResponse.sales.data[vendor.vendorHash] && vendorsResponse.sales.data[vendor.vendorHash].saleItems}
            trackerService={trackerService}
            ownedItemHashes={ownedItemHashes}
            currencyLookups={vendorsResponse.currencyLookups.data.itemQuantities}
            vendorEngramsService={vendorEngramsService}
            basePowerLevel={basePowerLevel}
          />
        </ErrorBoundary>
      )}
    </>
  );
}
