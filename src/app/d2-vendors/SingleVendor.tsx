import { DestinyVendorDefinition, DestinyVendorResponse } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getVendor as getVendorApi } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import Countdown from '../dim-ui/Countdown';
import { D2ManifestService } from '../manifest/manifest-service-json';
import VendorItems from './VendorItems';
import './vendor.scss';
import { fetchRatingsForVendor, fetchRatingsForVendorDef } from './vendor-ratings';
import { D2Store } from '../inventory/store-types';
import { getVendorItems } from './Vendor';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService } from '../inventory/d2-stores.service';
import { loadingTracker } from '../shell/loading-tracker';
import { UIViewInjectedProps } from '@uirouter/react';
import { Loading } from '../dim-ui/Loading';
import { Subscriptions } from '../rx-utils';
import { refresh$ } from '../shell/refresh';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { getBuckets } from '../destiny2/d2-buckets.service';

interface Props {
  account: DestinyAccount;
}

interface State {
  vendorHash: number;
  stores?: D2Store[];
  ownedItemHashes?: Set<number>;
  defs?: D2ManifestDefinitions;
  buckets?: InventoryBuckets;
  vendorDef?: DestinyVendorDefinition;
  vendorResponse?: DestinyVendorResponse;
}

/**
 * A page that loads its own info for a single vendor, so we can link to a vendor or show engram previews.
 */
export default class SingleVendor extends React.Component<Props & UIViewInjectedProps, State> {
  private subscriptions = new Subscriptions();

  constructor(props: Props) {
    super(props);
    this.state = {
      vendorHash: this.props.transition!.params().id
    };
  }

  async loadVendor() {
    // TODO: defs as a property, not state
    const defs = await getDefinitions();
    D2ManifestService.loaded = true;
    const buckets = await getBuckets();

    const vendorDef = defs.Vendor.get(this.state.vendorHash);
    if (!vendorDef) {
      throw new Error(`No known vendor with hash ${this.state.vendorHash}`);
    }
    this.setState({ defs, buckets, vendorDef });

    // TODO: if we had a cache per vendor (maybe in redux?) we could avoid this load sometimes?

    if (vendorDef.returnWithVendorRequest) {
      // TODO: get for all characters, or let people select a character? This is a hack
      // we at least need to display that character!
      let characterId: string = this.props.transition!.params().characterId;
      if (!characterId) {
        const stores =
          this.state.stores ||
          (await D2StoresService.getStoresStream(this.props.account)
            .take(1)
            .toPromise());
        if (stores) {
          characterId = stores.find((s) => s.current)!.id;
        }
      }
      const vendorResponse = await getVendorApi(
        this.props.account,
        characterId,
        this.state.vendorHash
      );

      this.setState({ vendorResponse });

      await fetchRatingsForVendor(defs, vendorResponse);
    } else {
      await fetchRatingsForVendorDef(defs, vendorDef);
    }
  }

  componentDidMount() {
    this.subscriptions.add(
      refresh$.subscribe(() => {
        loadingTracker.addPromise(this.loadVendor());
      }),
      D2StoresService.getStoresStream(this.props.account).subscribe((stores) => {
        if (stores) {
          const ownedItemHashes = new Set<number>();
          for (const store of stores) {
            for (const item of store.items) {
              ownedItemHashes.add(item.hash);
            }
          }
          this.setState({ stores, ownedItemHashes });
        }
      })
    );
    loadingTracker.addPromise(this.loadVendor());
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { defs, buckets, vendorDef, vendorResponse, ownedItemHashes } = this.state;
    const { account } = this.props;

    if (!vendorDef || !defs || !buckets) {
      return (
        <div className="vendor dim-page">
          <Loading />
        </div>
      );
    }

    // TODO:
    // * featured item
    // * enabled
    // * filter by character class
    const vendor = vendorResponse && vendorResponse.vendor.data;

    const destinationDef =
      vendor &&
      defs.Destination.get(vendorDef.locations[vendor.vendorLocationIndex].destinationHash);
    const placeDef = destinationDef && defs.Place.get(destinationDef.placeHash);

    const placeString = [
      destinationDef && destinationDef.displayProperties.name,
      placeDef && placeDef.displayProperties.name
    ]
      .filter((n) => n && n.length)
      .join(', ');
    // TODO: there's a cool background image but I'm not sure how to use it

    const vendorItems = getVendorItems(
      account,
      defs,
      buckets,
      vendorDef,
      vendorResponse && vendorResponse.itemComponents,
      vendorResponse && vendorResponse.sales.data
    );

    return (
      <div className="vendor dim-page">
        <ErrorBoundary name="SingleVendor">
          <div className="vendor-featured">
            <div className="vendor-featured-header">
              <div className="vendor-header-info">
                <h1>
                  {vendorDef.displayProperties.name}{' '}
                  <span className="vendor-location">{placeString}</span>
                </h1>
                <div>{vendorDef.displayProperties.description}</div>
                {vendorResponse && (
                  <div>
                    Inventory updates in{' '}
                    <Countdown endTime={new Date(vendorResponse.vendor.data.nextRefreshDate)} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <VendorItems
            defs={defs}
            vendor={vendor}
            vendorDef={vendorDef}
            vendorItems={vendorItems}
            ownedItemHashes={ownedItemHashes}
            currencyLookups={
              vendorResponse ? vendorResponse.currencyLookups.data.itemQuantities : {}
            }
          />
        </ErrorBoundary>
      </div>
    );
  }
}
