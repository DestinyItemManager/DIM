import {
  DestinyVendorsResponse,
  DestinyProfileResponse,
  DestinyCurrenciesComponent,
  DestinyItemPlug
} from 'bungie-api-ts/destiny2';
import React from 'react';
import { DestinyAccount } from '../accounts/destiny-account';
import { getVendors as getVendorsApi } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { loadingTracker } from '../shell/loading-tracker';
import { fetchRatingsForVendors } from './vendor-ratings';
import { DimStore } from '../inventory/store-types';
import Vendor from './Vendor';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService, mergeCollectibles } from '../inventory/d2-stores';
import { UIViewInjectedProps } from '@uirouter/react';
import { Loading } from '../dim-ui/Loading';
import { t } from 'app/i18next-t';
import { Subscriptions } from '../utils/rx-utils';
import { refresh$ } from '../shell/refresh';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import CharacterSelect from '../dim-ui/CharacterSelect';
import { RootState } from '../store/reducers';
import {
  ownedItemsSelector,
  sortedStoresSelector,
  profileResponseSelector
} from '../inventory/reducer';
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
import Hammer from 'react-hammerjs';
import _ from 'lodash';
import { VendorDrop } from 'app/vendorEngramsXyzApi/vendorDrops';
import { getAllVendorDrops } from 'app/vendorEngramsXyzApi/vendorEngramsXyzService';

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
  profileResponse?: DestinyProfileResponse;
  vendorEngramDrops: VendorDrop[];
  filterItems(item: DimItem): boolean;
}

function mapStateToProps() {
  const ownedItemSelectorInstance = ownedItemsSelector();
  return (state: RootState): StoreProps => ({
    stores: sortedStoresSelector(state),
    ownedItemHashes: ownedItemSelectorInstance(state),
    buckets: state.inventory.buckets,
    defs: state.manifest.d2Manifest,
    isPhonePortrait: state.shell.isPhonePortrait,
    searchQuery: state.shell.searchQuery,
    filterItems: searchFilterSelector(state),
    profileResponse: profileResponseSelector(state),
    vendorEngramDrops: state.vendorDrops.vendorDrops
  });
}

interface State {
  vendorsResponse?: DestinyVendorsResponse;
  selectedStoreId?: string;
  error?: Error;
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
    (_, props: Props) => props.profileResponse,
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
    const { selectedStoreId } = this.state;
    const { defs, account, transition, stores, dispatch } = this.props;
    if (this.state.error) {
      this.setState({ error: undefined });
    }

    if ($featureFlags.vendorEngrams) {
      dispatch(getAllVendorDrops());
    }

    if (!defs) {
      throw new Error('expected defs');
    }

    let characterId: string = selectedStoreId || transition!.params().characterId;
    if (!characterId) {
      if (stores.length) {
        characterId = stores.find((s) => s.current)!.id;
      }
    }

    if (!characterId) {
      this.setState({ error: new Error("Couldn't load any characters.") });
      return;
    }

    let vendorsResponse;
    try {
      vendorsResponse = await getVendorsApi(account, characterId);
      this.setState({ vendorsResponse, selectedStoreId: characterId });
    } catch (error) {
      this.setState({ error });
    }

    if ($featureFlags.reviewsEnabled && vendorsResponse) {
      dispatch(fetchRatingsForVendors(defs, vendorsResponse));
    }
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
        this.props.defs &&
        this.props.stores.length) ||
      prevState.selectedStoreId !== this.state.selectedStoreId
    ) {
      loadingTracker.addPromise(this.loadVendors());
    }
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { vendorsResponse, error, selectedStoreId, filterToUnacquired } = this.state;
    const {
      defs,
      stores,
      ownedItemHashes,
      isPhonePortrait,
      searchQuery,
      filterItems,
      profileResponse,
      vendorEngramDrops
    } = this.props;

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

    const selectedStore = stores.find((s) => s.id === selectedStoreId)!;

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

    const fullOwnedItemHashes = enhanceOwnedItemsWithPlugSets(
      ownedItemHashes,
      defs,
      profileResponse
    );

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
          {!isPhonePortrait && vendorGroups && (
            <VendorsMenu groups={vendorGroups} vendorEngramDrops={vendorEngramDrops} />
          )}
        </PageWithMenu.Menu>
        <PageWithMenu.Contents>
          <Hammer direction="DIRECTION_HORIZONTAL" onSwipe={this.handleSwipe}>
            <div>
              {vendorGroups && currencyLookups && defs ? (
                vendorGroups.map((group) => (
                  <VendorGroup
                    key={group.def.hash}
                    defs={defs}
                    group={group}
                    ownedItemHashes={fullOwnedItemHashes}
                    currencyLookups={currencyLookups}
                    filtering={filterToUnacquired || searchQuery.length > 0}
                    vendorDrops={vendorEngramDrops}
                  />
                ))
              ) : (
                <Loading />
              )}
            </div>
          </Hammer>
        </PageWithMenu.Contents>
      </PageWithMenu>
    );
  }

  private onCharacterChanged = (storeId: string) => {
    this.setState({ selectedStoreId: storeId, vendorsResponse: undefined });
  };

  private setFilterToUnacquired = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ filterToUnacquired: e.currentTarget.checked });
  };

  private handleSwipe: HammerListener = (e) => {
    const { stores } = this.props;
    const { selectedStoreId } = this.state;
    const characters = stores.filter((s) => !s.isVault);

    const selectedStoreIndex = selectedStoreId
      ? characters.findIndex((s) => s.id === selectedStoreId)
      : characters.findIndex((s) => s.current);

    if (e.direction === 2 && selectedStoreIndex < characters.length - 1) {
      this.setState({ selectedStoreId: characters[selectedStoreIndex + 1].id });
    } else if (e.direction === 4 && selectedStoreIndex > 0) {
      this.setState({ selectedStoreId: characters[selectedStoreIndex - 1].id });
    }
  };
}

function VendorGroup({
  group,
  ownedItemHashes,
  currencyLookups,
  defs,
  filtering,
  vendorDrops
}: {
  defs: D2ManifestDefinitions;
  group: D2VendorGroup;
  ownedItemHashes?: Set<number>;
  currencyLookups: DestinyCurrenciesComponent['itemQuantities'];
  filtering: boolean;
  vendorDrops?: VendorDrop[];
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
            vendorDrops={vendorDrops}
          />
        </ErrorBoundary>
      ))}
    </>
  );
}

function enhanceOwnedItemsWithPlugSets(
  ownedItemHashes: Set<number>,
  defs?: D2ManifestDefinitions,
  profileResponse?: DestinyProfileResponse
) {
  if (!defs || !profileResponse) {
    return ownedItemHashes;
  }

  const allItems = new Set(ownedItemHashes);

  const processPlugSet = (plugs: { [key: number]: DestinyItemPlug[] }) => {
    _.forIn(plugs, (plugSet, plugSetHash) => {
      const plugSetDef = defs.PlugSet.get(parseInt(plugSetHash, 10));
      for (const item of plugSetDef.reusablePlugItems) {
        const itemDef = defs.InventoryItem.get(item.plugItemHash);
        if (plugSet.some((k) => k.plugItemHash === itemDef.hash && k.enabled)) {
          allItems.add(itemDef.hash);
        }
      }
    });
  };

  if (profileResponse.profilePlugSets.data) {
    processPlugSet(profileResponse.profilePlugSets.data.plugs);
  }

  if (profileResponse.characterPlugSets.data) {
    for (const plugSetData of Object.values(profileResponse.characterPlugSets.data)) {
      processPlugSet(plugSetData.plugs);
    }
  }

  return allItems;
}

export default connect<StoreProps>(mapStateToProps)(Vendors);
