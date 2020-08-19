import {
  DestinyProfileResponse,
  DestinyCurrenciesComponent,
  DestinyItemPlug,
  DestinyCollectibleComponent,
} from 'bungie-api-ts/destiny2';
import React, { useState, useEffect, useMemo } from 'react';
import { DestinyAccount } from '../accounts/destiny-account';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { loadingTracker } from '../shell/loading-tracker';
import { DimStore } from '../inventory/store-types';
import Vendor from './Vendor';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService, mergeCollectibles } from '../inventory/d2-stores';
import { t } from 'app/i18next-t';
import { refresh$ } from '../shell/refresh';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import CharacterSelect from '../dim-ui/CharacterSelect';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import {
  ownedItemsSelector,
  sortedStoresSelector,
  profileResponseSelector,
  bucketsSelector,
} from '../inventory/selectors';
import { connect } from 'react-redux';
import {
  D2VendorGroup,
  toVendorGroups,
  filterVendorGroupsToUnacquired,
  filterVendorGroupsToSearch,
} from './d2-vendors';
import styles from './Vendors.m.scss';
import { searchFilterSelector } from 'app/search/search-filter';
import { DimItem } from 'app/inventory/item-types';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import VendorsMenu from './VendorsMenu';
import Hammer from 'react-hammerjs';
import _ from 'lodash';
import { VendorDrop } from 'app/vendorEngramsXyzApi/vendorDrops';
import { emptyArray, emptyObject } from 'app/utils/empty';
import ErrorPanel from 'app/shell/ErrorPanel';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { loadAllVendors } from './actions';
import { useSubscription } from 'app/utils/hooks';
import { VendorsState } from './reducer';

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
  vendors: VendorsState['vendorsByCharacter'];
  filterItems(item: DimItem): boolean;
}

function mapStateToProps() {
  const ownedItemSelectorInstance = ownedItemsSelector();

  return (state: RootState): StoreProps => ({
    stores: sortedStoresSelector(state),
    ownedItemHashes: ownedItemSelectorInstance(state),
    buckets: bucketsSelector(state),
    defs: state.manifest.d2Manifest,
    isPhonePortrait: state.shell.isPhonePortrait,
    searchQuery: state.shell.searchQuery,
    filterItems: searchFilterSelector(state),
    profileResponse: profileResponseSelector(state),
    vendorEngramDrops: state.vendorDrops.vendorDrops,
    vendors: state.vendors.vendorsByCharacter,
  });
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

/**
 * The "All Vendors" page for D2 that shows all the rotating vendors.
 */
function Vendors({
  defs,
  stores,
  buckets,
  ownedItemHashes,
  isPhonePortrait,
  searchQuery,
  filterItems,
  profileResponse,
  vendorEngramDrops,
  vendors,
  dispatch,
  account,
}: Props) {
  const [characterId, setCharacterId] = useState<string>();
  const [filterToUnacquired, setFilterToUnacquired] = useState(false);

  const selectedStoreId = characterId || getCurrentStore(stores)?.id;

  useEffect(() => {
    D2StoresService.getStoresStream(account);
    if (selectedStoreId) {
      dispatch(loadAllVendors(account, selectedStoreId));
    }
  }, [account, selectedStoreId, dispatch]);

  useSubscription(() =>
    refresh$.subscribe(() => {
      if (selectedStoreId) {
        loadingTracker.addPromise(dispatch(loadAllVendors(account, selectedStoreId, true)));
      }
    })
  );

  const onCharacterChanged = (storeId: string) => setCharacterId(storeId);

  const onSetFilterToUnacquired = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFilterToUnacquired(e.currentTarget.checked);

  const handleSwipe: HammerListener = (e) => {
    const characters = stores.filter((s) => !s.isVault);

    const selectedStoreIndex = selectedStoreId
      ? characters.findIndex((s) => s.id === selectedStoreId)
      : characters.findIndex((s) => s.current);

    if (e.direction === 2 && selectedStoreIndex < characters.length - 1) {
      setCharacterId(characters[selectedStoreIndex + 1].id);
    } else if (e.direction === 4 && selectedStoreIndex > 0) {
      setCharacterId(characters[selectedStoreIndex - 1].id);
    }
  };

  const mergedCollectibles = useMemo(
    () =>
      profileResponse
        ? mergeCollectibles(
            profileResponse.profileCollectibles,
            profileResponse.characterCollectibles
          )
        : emptyObject<{
            [x: number]: DestinyCollectibleComponent;
          }>(),
    [profileResponse]
  );

  const vendorData = selectedStoreId ? vendors[selectedStoreId] : undefined;
  const vendorsResponse = vendorData?.vendorsResponse;

  let vendorGroups = useMemo(
    () =>
      vendorsResponse && defs && buckets
        ? toVendorGroups(vendorsResponse, defs, buckets, account, mergedCollectibles)
        : emptyArray<D2VendorGroup>(),
    [account, buckets, defs, mergedCollectibles, vendorsResponse]
  );

  if (!vendorsResponse && vendorData?.error) {
    return (
      <PageWithMenu>
        <ErrorPanel error={vendorData.error} />
      </PageWithMenu>
    );
  }

  if (!stores.length) {
    return (
      <PageWithMenu>
        <ShowPageLoading message={t('Loading.Profile')} />
      </PageWithMenu>
    );
  }

  const selectedStore = stores.find((s) => s.id === selectedStoreId)!;
  const currencyLookups = vendorsResponse?.currencyLookups.data?.itemQuantities;

  if (vendorGroups && filterToUnacquired) {
    vendorGroups = filterVendorGroupsToUnacquired(vendorGroups);
  }
  if (vendorGroups && searchQuery.length) {
    vendorGroups = filterVendorGroupsToSearch(vendorGroups, searchQuery, filterItems);
  }

  const fullOwnedItemHashes = enhanceOwnedItemsWithPlugSets(ownedItemHashes, defs, profileResponse);

  return (
    <PageWithMenu>
      <PageWithMenu.Menu>
        {selectedStore && (
          <CharacterSelect
            stores={stores}
            vertical={!isPhonePortrait}
            isPhonePortrait={isPhonePortrait}
            selectedStore={selectedStore}
            onCharacterChanged={onCharacterChanged}
          />
        )}
        {selectedStore && (
          <label className={styles.checkButton}>
            {t('Vendors.FilterToUnacquired')}{' '}
            <input type="checkbox" onChange={onSetFilterToUnacquired} />
          </label>
        )}
        {!isPhonePortrait && vendorGroups && (
          <VendorsMenu groups={vendorGroups} vendorEngramDrops={vendorEngramDrops} />
        )}
      </PageWithMenu.Menu>
      <PageWithMenu.Contents>
        <Hammer direction="DIRECTION_HORIZONTAL" onSwipe={handleSwipe}>
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
                  characterId={selectedStore.id}
                />
              ))
            ) : (
              <ShowPageLoading message={t('Loading.Vendors')} />
            )}
          </div>
        </Hammer>
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

function VendorGroup({
  group,
  ownedItemHashes,
  currencyLookups,
  defs,
  filtering,
  vendorDrops,
  characterId,
}: {
  defs: D2ManifestDefinitions;
  group: D2VendorGroup;
  ownedItemHashes?: Set<number>;
  currencyLookups: DestinyCurrenciesComponent['itemQuantities'];
  filtering: boolean;
  vendorDrops?: VendorDrop[];
  characterId: string;
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
            characterId={characterId}
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
