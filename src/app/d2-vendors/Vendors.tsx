import {
  DestinyVendorsResponse,
  DestinyProfileResponse,
  DestinyCurrenciesComponent
} from 'bungie-api-ts/destiny2';
import React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getVendors as getVendorsApi, getCollections } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { loadingTracker } from '../shell/loading-tracker';
import { fetchRatingsForVendors } from './vendor-ratings';
import { DimStore } from '../inventory/store-types';
import Vendor from './Vendor';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService, mergeCollectibles } from '../inventory/d2-stores.service';
import { UIViewInjectedProps } from '@uirouter/react';
import { Loading } from '../dim-ui/Loading';
import { t } from 'app/i18next-t';
import { Subscriptions } from '../rx-utils';
import { refresh$ } from '../shell/refresh';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import CharacterSelect from '../character-select/CharacterSelect';
import { RootState } from '../store/reducers';
import { ownedItemsSelector, sortedStoresSelector } from '../inventory/reducer';
import { DispatchProp, connect } from 'react-redux';
import { createSelector } from 'reselect';
import {
  D2VendorGroup,
  toVendorGroups,
  filterVendorGroupsToUnacquired,
  filterVendorGroupsToSearch
} from './d2-vendors';
import styles from './Vendors.m.scss';
import { searchFilterSelector } from 'app/search/search-filters';
import { DimItem } from 'app/inventory/item-types';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import VendorsMenu from './VendorsMenu';

interface ProvidedProps {
  account: DestinyAccount;
}
interface StoreProps {
  stores: DimStore[];
  buckets?: InventoryBuckets;
  defs?: D2ManifestDefinitions;
  ownedItemHashes: Set<number>;
  isPhonePortrait: boolean;
  searchQuery: string;
  filterItems(item: DimItem): boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    stores: sortedStoresSelector(state),
    ownedItemHashes: ownedItemsSelector(state),
    buckets: state.inventory.buckets,
    defs: state.manifest.d2Manifest,
    isPhonePortrait: state.shell.isPhonePortrait,
    searchQuery: state.shell.searchQuery,
    filterItems: searchFilterSelector(state)
  };
}

interface State {
  vendorsResponse?: DestinyVendorsResponse;
  selectedStore?: DimStore;
  error?: Error;
  profileResponse?: DestinyProfileResponse;
  filterToUnacquired: boolean;
}

type Props = ProvidedProps & StoreProps & UIViewInjectedProps & DispatchProp<any>;

const EMPTY_MAP = {};
const EMPTY_ARRAY = [];

/**
 * The "All Vendors" page for D2 that shows all the rotating vendors.
 */
class Vendors extends React.Component<Props, State> {
  state: State = { filterToUnacquired: false };

  private subscriptions = new Subscriptions();
  private mergedCollectiblesSelector = createSelector(
    (state: State) => state.profileResponse,
    (profileResponse) =>
      profileResponse
        ? mergeCollectibles(
            profileResponse.profileCollectibles,
            profileResponse.characterCollectibles
          )
        : EMPTY_MAP
  );
  private vendorGroupsSelector = createSelector(
    (state: State) => state.vendorsResponse,
    (_, props: Props) => props.defs,
    (_, props: Props) => props.buckets,
    (_, props: Props) => props.account,
    this.mergedCollectiblesSelector,
    (vendorsResponse, defs, buckets, account, mergedCollectibles): readonly D2VendorGroup[] =>
      vendorsResponse && defs && buckets
        ? toVendorGroups(vendorsResponse, defs, buckets, account, mergedCollectibles)
        : EMPTY_ARRAY
  );

  async loadVendors() {
    let { selectedStore } = this.state;
    const { defs, account, transition, stores, dispatch } = this.props;
    if (this.state.error) {
      this.setState({ error: undefined });
    }

    if (!defs) {
      throw new Error('expected defs');
    }

    let characterId: string = selectedStore ? selectedStore.id : transition!.params().characterId;
    if (!characterId) {
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
      vendorsResponse = await getVendorsApi(account, characterId);
      this.setState({ vendorsResponse, selectedStore });
    } catch (error) {
      this.setState({ error });
    }

    if (vendorsResponse) {
      dispatch(fetchRatingsForVendors(defs, vendorsResponse));
    }

    const profileResponse = await getCollections(account);
    this.setState({ profileResponse });
  }

  componentDidMount() {
    if (this.props.defs && this.props.stores.length) {
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

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (
      ((!prevProps.defs || !prevProps.stores.length) &&
        (this.props.defs && this.props.stores.length)) ||
      prevState.selectedStore !== this.state.selectedStore
    ) {
      loadingTracker.addPromise(this.loadVendors());
    }
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { vendorsResponse, error, selectedStore, filterToUnacquired } = this.state;
    const { defs, stores, ownedItemHashes, isPhonePortrait, searchQuery, filterItems } = this.props;

    if (error) {
      return (
        <PageWithMenu>
          <div className="dim-error">
            <h2>{t('ErrorBoundary.Title')}</h2>
            <div>{error.message}</div>
          </div>
        </PageWithMenu>
      );
    }

    if (!stores.length) {
      return (
        <PageWithMenu>
          <Loading />
        </PageWithMenu>
      );
    }

    let vendorGroups = vendorsResponse && this.vendorGroupsSelector(this.state, this.props);
    const currencyLookups =
      vendorsResponse &&
      vendorsResponse.currencyLookups.data &&
      vendorsResponse.currencyLookups.data.itemQuantities;

    if (vendorGroups && filterToUnacquired) {
      vendorGroups = filterVendorGroupsToUnacquired(vendorGroups);
    }
    if (vendorGroups && searchQuery.length) {
      vendorGroups = filterVendorGroupsToSearch(vendorGroups, searchQuery, filterItems);
    }

    return (
      <PageWithMenu>
        <PageWithMenu.Menu>
          {selectedStore && (
            <CharacterSelect
              stores={stores}
              vertical={!isPhonePortrait}
              isPhonePortrait={isPhonePortrait}
              selectedStore={selectedStore}
              onCharacterChanged={this.onCharacterChanged}
            />
          )}
          {selectedStore && (
            <label className={styles.checkButton}>
              {t('Vendors.FilterToUnacquired')}{' '}
              <input type="checkbox" onChange={this.setFilterToUnacquired} />
            </label>
          )}
          {!isPhonePortrait && vendorGroups && <VendorsMenu groups={vendorGroups} />}
        </PageWithMenu.Menu>
        <PageWithMenu.Contents>
          {vendorGroups && currencyLookups && defs ? (
            vendorGroups.map((group) => (
              <VendorGroup
                key={group.def.hash}
                defs={defs}
                group={group}
                ownedItemHashes={ownedItemHashes}
                currencyLookups={currencyLookups}
                filtering={filterToUnacquired || searchQuery.length > 0}
              />
            ))
          ) : (
            <Loading />
          )}
        </PageWithMenu.Contents>
      </PageWithMenu>
    );
  }

  private onCharacterChanged = (storeId: string) => {
    const selectedStore = this.props.stores.find((s) => s.id === storeId)!;
    this.setState({ selectedStore, vendorsResponse: undefined });
  };

  private setFilterToUnacquired = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ filterToUnacquired: e.currentTarget.checked });
  };
}

function VendorGroup({
  group,
  ownedItemHashes,
  currencyLookups,
  defs,
  filtering
}: {
  defs: D2ManifestDefinitions;
  group: D2VendorGroup;
  ownedItemHashes?: Set<number>;
  currencyLookups: DestinyCurrenciesComponent['itemQuantities'];
  filtering: boolean;
}) {
  return (
    <>
      <h2>{group.def.categoryName}</h2>
      {group.vendors.map((vendor) => (
        <ErrorBoundary key={vendor.def.hash} name="Vendor">
          <Vendor
            defs={defs}
            vendor={vendor}
            ownedItemHashes={ownedItemHashes}
            currencyLookups={currencyLookups}
            filtering={filtering}
          />
        </ErrorBoundary>
      ))}
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(Vendors);
