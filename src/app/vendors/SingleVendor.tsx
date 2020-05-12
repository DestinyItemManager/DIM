import { DestinyVendorResponse, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React from 'react';
import { DestinyAccount } from '../accounts/destiny-account';
import { getVendor as getVendorApi } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import Countdown from '../dim-ui/Countdown';
import VendorItems from './VendorItems';
import { fetchRatingsForVendor, fetchRatingsForVendorDef } from './vendor-ratings';
import { DimStore } from '../inventory/store-types';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService, mergeCollectibles } from '../inventory/d2-stores';
import { loadingTracker } from '../shell/loading-tracker';
import { Subscriptions } from '../utils/rx-utils';
import { refresh$ } from '../shell/refresh';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { connect } from 'react-redux';
import {
  storesSelector,
  ownedItemsSelector,
  profileResponseSelector
} from '../inventory/selectors';
import { RootState, ThunkDispatchProp } from '../store/reducers';
import { toVendor } from './d2-vendors';
import styles from './SingleVendor.m.scss';
import vendorStyles from './Vendor.m.scss';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { RouteComponentProps, withRouter } from 'react-router';
import { parse } from 'simple-query-string';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';

interface ProvidedProps {
  account: DestinyAccount;
  vendorHash: number;
}

interface StoreProps {
  stores: DimStore[];
  defs?: D2ManifestDefinitions;
  buckets?: InventoryBuckets;
  ownedItemHashes: Set<number>;
  profileResponse?: DestinyProfileResponse;
}

function mapStateToProps() {
  const ownedItemSelectorInstance = ownedItemsSelector();
  return (state: RootState): StoreProps => ({
    stores: storesSelector(state),
    ownedItemHashes: ownedItemSelectorInstance(state),
    buckets: state.inventory.buckets,
    defs: state.manifest.d2Manifest,
    profileResponse: profileResponseSelector(state)
  });
}

interface State {
  vendorResponse?: DestinyVendorResponse;
}

type Props = ProvidedProps & StoreProps & RouteComponentProps & ThunkDispatchProp;

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
    if (this.props.defs) {
      loadingTracker.addPromise(this.loadVendor());
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.defs && !prevProps.defs) {
      loadingTracker.addPromise(this.loadVendor());
    }
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { vendorResponse } = this.state;
    const { account, buckets, ownedItemHashes, defs, profileResponse, vendorHash } = this.props;

    if (!defs || !buckets) {
      return <ShowPageLoading message={t('Manifest.Load')} />;
    }

    const vendorDef = defs.Vendor.get(vendorHash);
    if (!vendorDef) {
      throw new Error(`No known vendor with hash ${vendorHash}`);
    }

    // TODO:
    // * featured item
    // * enabled
    // * filter by character class
    const vendor = vendorResponse?.vendor.data;

    const destinationDef =
      vendor &&
      defs.Destination.get(vendorDef.locations[vendor.vendorLocationIndex].destinationHash);
    const placeDef = destinationDef && defs.Place.get(destinationDef.placeHash);

    const placeString = [destinationDef?.displayProperties.name, placeDef?.displayProperties.name]
      .filter((n) => n?.length)
      .join(', ');
    // TODO: there's a cool background image but I'm not sure how to use it

    const mergedCollectibles = profileResponse
      ? mergeCollectibles(
          profileResponse.profileCollectibles,
          profileResponse.characterCollectibles
        )
      : {};

    const d2Vendor = toVendor(
      vendorHash,
      defs,
      buckets,
      vendor,
      account,
      vendorResponse?.itemComponents,
      vendorResponse?.sales.data,
      mergedCollectibles
    );

    if (!d2Vendor) {
      return null;
    }

    return (
      <div className="vendor dim-page">
        <ErrorBoundary name="SingleVendor">
          <div className={styles.featuredHeader}>
            <h1>
              {d2Vendor.def.displayProperties.name}{' '}
              <span className={vendorStyles.location}>{placeString}</span>
            </h1>
            <div>{d2Vendor.def.displayProperties.description}</div>
            {d2Vendor.component && (
              <div>
                Inventory updates in{' '}
                <Countdown endTime={new Date(d2Vendor.component.nextRefreshDate)} />
              </div>
            )}
          </div>
          <VendorItems
            defs={defs}
            vendor={d2Vendor}
            ownedItemHashes={ownedItemHashes}
            currencyLookups={vendorResponse?.currencyLookups.data?.itemQuantities ?? {}}
          />
        </ErrorBoundary>
      </div>
    );
  }

  private async loadVendor() {
    const { dispatch, defs, vendorHash } = this.props;
    if (!defs) {
      throw new Error('expected defs');
    }

    const vendorDef = defs.Vendor.get(vendorHash);
    if (!vendorDef) {
      throw new Error(`No known vendor with hash ${vendorHash}`);
    }

    // TODO: if we had a cache per vendor (maybe in redux?) we could avoid this load sometimes?

    if (vendorDef.returnWithVendorRequest) {
      // TODO: get for all characters, or let people select a character? This is a hack
      // we at least need to display that character!
      let characterId = parse(location.search).characterId as string;
      if (!characterId) {
        const stores = this.props.stores;
        if (stores) {
          characterId = getCurrentStore(stores)!.id;
        }
      }
      const vendorResponse = await getVendorApi(this.props.account, characterId, vendorHash);

      this.setState({ vendorResponse });

      if ($featureFlags.reviewsEnabled) {
        dispatch(fetchRatingsForVendor(defs, vendorResponse));
      }
    } else {
      if ($featureFlags.reviewsEnabled) {
        dispatch(fetchRatingsForVendorDef(defs, vendorDef));
      }
    }
  }
}

export default withRouter(connect<StoreProps>(mapStateToProps)(SingleVendor));
