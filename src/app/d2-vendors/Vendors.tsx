import {
  DestinyVendorsResponse,
  DestinyVendorGroup,
  DestinyProfileResponse,
  DestinyCollectibleComponent
} from 'bungie-api-ts/destiny2';
import React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getVendors as getVendorsApi, getCollections } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { loadingTracker } from '../shell/loading-tracker';
import './vendor.scss';
import { fetchRatingsForVendors } from './vendor-ratings';
import { DimStore } from '../inventory/store-types';
import Vendor from './Vendor';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService, mergeCollectibles } from '../inventory/d2-stores.service';
import { UIViewInjectedProps } from '@uirouter/react';
import { Loading } from '../dim-ui/Loading';
import { t } from 'i18next';
import { Subscriptions } from '../rx-utils';
import { refresh$ } from '../shell/refresh';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import CharacterSelect from '../character-select/CharacterSelect';
import { sortStores } from '../shell/filters';
import { RootState } from '../store/reducers';
import { storesSelector, ownedItemsSelector } from '../inventory/reducer';
import { DispatchProp, connect } from 'react-redux';

interface ProvidedProps {
  account: DestinyAccount;
}
interface StoreProps {
  stores: DimStore[];
  buckets?: InventoryBuckets;
  defs?: D2ManifestDefinitions;
  ownedItemHashes: Set<number>;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    stores: storesSelector(state),
    ownedItemHashes: ownedItemsSelector(state),
    buckets: state.inventory.buckets,
    defs: state.manifest.d2Manifest
  };
}

interface State {
  vendorsResponse?: DestinyVendorsResponse;
  selectedStore?: DimStore;
  error?: Error;
  profileResponse?: DestinyProfileResponse;
}

type Props = ProvidedProps & StoreProps & UIViewInjectedProps & DispatchProp<any>;

/**
 * The "All Vendors" page for D2 that shows all the rotating vendors.
 */
class Vendors extends React.Component<Props, State> {
  private subscriptions = new Subscriptions();

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  async loadVendors(selectedStore: DimStore | undefined = this.state.selectedStore) {
    if (this.state.error) {
      this.setState({ error: undefined });
    }

    if (!this.props.defs) {
      throw new Error('expected defs');
    }

    let characterId: string = this.state.selectedStore
      ? this.state.selectedStore.id
      : this.props.transition!.params().characterId;
    if (!characterId) {
      const stores = this.props.stores;
      if (stores.length) {
        characterId = stores.find((s) => s.current)!.id;
        selectedStore = stores.find((s) => s.id === characterId);
      }
    }

    if (!characterId) {
      this.setState({ error: new Error("Couldn't load any characters.") });
      return;
    }

    let vendorsResponse;
    try {
      vendorsResponse = await getVendorsApi(this.props.account, characterId);
      this.setState({ vendorsResponse, selectedStore });
    } catch (error) {
      this.setState({ error });
    }

    if (vendorsResponse) {
      this.props.dispatch(fetchRatingsForVendors(this.props.defs, vendorsResponse));
    }

    const profileResponse = await getCollections(this.props.account);
    this.setState({ profileResponse });
  }

  componentDidMount() {
    if (this.props.defs) {
      const promise = this.loadVendors();
      loadingTracker.addPromise(promise);
    }

    D2StoresService.getStoresStream(this.props.account);

    this.subscriptions.add(
      refresh$.subscribe(() => {
        const promise = this.loadVendors();
        loadingTracker.addPromise(promise);
      })
    );
  }

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.defs && this.props.defs) {
      loadingTracker.addPromise(this.loadVendors());
    }
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { vendorsResponse, error, selectedStore, profileResponse } = this.state;
    const { defs, account, buckets, stores, ownedItemHashes } = this.props;

    const mergedCollectibles = profileResponse
      ? mergeCollectibles(
          profileResponse.profileCollectibles,
          profileResponse.characterCollectibles
        )
      : {};

    if (error) {
      return (
        <div className="vendor dim-page">
          <div className="dim-error">
            <h2>{t('ErrorBoundary.Title')}</h2>
            <div>{error.message}</div>
          </div>
        </div>
      );
    }

    if (!vendorsResponse || !defs || !buckets || !stores) {
      return (
        <div className="vendor dim-page">
          <Loading />
        </div>
      );
    }

    return (
      <div className="vendor d2-vendors dim-page">
        {selectedStore && (
          <CharacterSelect
            stores={sortStores(stores)}
            selectedStore={selectedStore}
            onCharacterChanged={this.onCharacterChanged}
          />
        )}
        {Object.values(vendorsResponse.vendorGroups.data.groups).map((group) => (
          <VendorGroup
            key={group.vendorGroupHash}
            defs={defs}
            buckets={buckets}
            group={group}
            vendorsResponse={vendorsResponse}
            ownedItemHashes={ownedItemHashes}
            account={account}
            mergedCollectibles={mergedCollectibles}
          />
        ))}
      </div>
    );
  }

  private onCharacterChanged = (storeId: string) => {
    const selectedStore = this.props.stores.find((s) => s.id === storeId);
    this.setState({ selectedStore });
    this.loadVendors(selectedStore);
  };
}

function VendorGroup({
  defs,
  buckets,
  group,
  vendorsResponse,
  ownedItemHashes,
  account,
  mergedCollectibles
}: {
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  group: DestinyVendorGroup;
  vendorsResponse: DestinyVendorsResponse;
  ownedItemHashes?: Set<number>;
  account: DestinyAccount;
  mergedCollectibles?: {
    [hash: number]: DestinyCollectibleComponent;
  };
}) {
  const groupDef = defs.VendorGroup.get(group.vendorGroupHash);

  return (
    <>
      <h2>{groupDef.categoryName}</h2>
      {group.vendorHashes
        .map((h) => vendorsResponse.vendors.data[h])
        .map((vendor) => (
          <ErrorBoundary key={vendor.vendorHash} name="Vendor">
            <Vendor
              account={account}
              defs={defs}
              buckets={buckets}
              vendor={vendor}
              itemComponents={vendorsResponse.itemComponents[vendor.vendorHash]}
              sales={
                vendorsResponse.sales.data[vendor.vendorHash] &&
                vendorsResponse.sales.data[vendor.vendorHash].saleItems
              }
              ownedItemHashes={ownedItemHashes}
              currencyLookups={vendorsResponse.currencyLookups.data.itemQuantities}
              mergedCollectibles={mergedCollectibles}
            />
          </ErrorBoundary>
        ))}
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(Vendors);
