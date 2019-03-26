import { DestinyVendorResponse, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getVendor as getVendorApi, getCollections } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import Countdown from '../dim-ui/Countdown';
import { D2ManifestService } from '../manifest/manifest-service-json';
import VendorItems from './VendorItems';
import './vendor.scss';
import { fetchRatingsForVendor, fetchRatingsForVendorDef } from './vendor-ratings';
import { DimStore } from '../inventory/store-types';
import { getVendorItems } from './Vendor';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService, mergeCollectibles } from '../inventory/d2-stores.service';
import { loadingTracker } from '../shell/loading-tracker';
import { UIViewInjectedProps } from '@uirouter/react';
import { Loading } from '../dim-ui/Loading';
import { Subscriptions } from '../rx-utils';
import { refresh$ } from '../shell/refresh';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { connect, DispatchProp } from 'react-redux';
import { storesSelector, ownedItemsSelector } from '../inventory/reducer';
import { RootState } from '../store/reducers';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  stores: DimStore[];
  buckets?: InventoryBuckets;
  ownedItemHashes: Set<number>;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    stores: storesSelector(state),
    ownedItemHashes: ownedItemsSelector(state),
    buckets: state.inventory.buckets
  };
}

interface State {
  defs?: D2ManifestDefinitions;
  vendorResponse?: DestinyVendorResponse;
  profileResponse?: DestinyProfileResponse;
}

type Props = ProvidedProps & StoreProps & UIViewInjectedProps & DispatchProp<any>;

/**
 * A page that loads its own info for a single vendor, so we can link to a vendor or show engram previews.
 */
class SingleVendor extends React.Component<Props, State> {
  private subscriptions = new Subscriptions();

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    D2StoresService.getStoresStream(this.props.account);
    this.subscriptions.add(
      refresh$.subscribe(() => {
        loadingTracker.addPromise(this.loadVendor());
      })
    );
    if (this.props.buckets) {
      loadingTracker.addPromise(this.loadVendor());
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.buckets && this.props.buckets) {
      loadingTracker.addPromise(this.loadVendor());
    }
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { defs, vendorResponse, profileResponse } = this.state;
    const { account, buckets, ownedItemHashes } = this.props;

    if (!defs || !buckets) {
      return (
        <div className="vendor dim-page">
          <Loading />
        </div>
      );
    }

    const vendorHash = this.getVendorHash();
    const vendorDef = defs.Vendor.get(vendorHash);
    if (!vendorDef) {
      throw new Error(`No known vendor with hash ${vendorHash}`);
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

    const mergedCollectibles = profileResponse
      ? mergeCollectibles(
          profileResponse.profileCollectibles,
          profileResponse.characterCollectibles
        )
      : {};

    const vendorItems = getVendorItems(
      account,
      defs,
      buckets,
      vendorDef,
      vendorResponse && vendorResponse.itemComponents,
      vendorResponse && vendorResponse.sales.data,
      mergedCollectibles
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

  private async loadVendor() {
    // TODO: defs as a property, not state
    const defs = await getDefinitions();
    D2ManifestService.loaded = true;
    const { dispatch } = this.props;
    const vendorHash = this.getVendorHash();

    const vendorDef = defs.Vendor.get(vendorHash);
    if (!vendorDef) {
      throw new Error(`No known vendor with hash ${vendorHash}`);
    }
    this.setState({ defs });

    // TODO: if we had a cache per vendor (maybe in redux?) we could avoid this load sometimes?

    if (vendorDef.returnWithVendorRequest) {
      // TODO: get for all characters, or let people select a character? This is a hack
      // we at least need to display that character!
      let characterId: string = this.props.transition!.params().characterId;
      if (!characterId) {
        const stores = this.props.stores;
        if (stores) {
          characterId = stores.find((s) => s.current)!.id;
        }
      }
      const vendorResponse = await getVendorApi(this.props.account, characterId, vendorHash);

      this.setState({ vendorResponse });

      dispatch(fetchRatingsForVendor(defs, vendorResponse));
    } else {
      dispatch(fetchRatingsForVendorDef(defs, vendorDef));
    }

    const profileResponse = await getCollections(this.props.account);
    this.setState({ profileResponse });
  }

  private getVendorHash = () => this.props.transition!.params().id;
}

export default connect<StoreProps>(mapStateToProps)(SingleVendor);
