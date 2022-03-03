import { DestinyAccount } from 'app/accounts/destiny-account';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import CheckButton from 'app/dim-ui/CheckButton';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { useD2Definitions } from 'app/manifest/selectors';
import { ItemFilter } from 'app/search/filter-types';
import { searchFilterSelector } from 'app/search/search-filter';
import ErrorPanel from 'app/shell/ErrorPanel';
import { loadingTracker } from 'app/shell/loading-tracker';
import { refresh$ } from 'app/shell/refresh-events';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { useEventBusListener } from 'app/utils/hooks';
import { DestinyCurrenciesComponent } from 'bungie-api-ts/destiny2';
import { motion, PanInfo } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import { loadAllVendors } from './actions';
import {
  D2VendorGroup,
  filterVendorGroupsToSearch,
  filterVendorGroupsToUnacquired,
} from './d2-vendors';
import { VendorsState } from './reducer';
import {
  ownedVendorItemsSelector,
  vendorGroupsForCharacterSelector,
  vendorsByCharacterSelector,
} from './selectors';
import Vendor from './Vendor';
import styles from './Vendors.m.scss';
import VendorsMenu from './VendorsMenu';

interface ProvidedProps {
  account: DestinyAccount;
}
interface StoreProps {
  stores: DimStore[];
  searchQuery: string;
  vendors: VendorsState['vendorsByCharacter'];
  filterItems: ItemFilter;
}

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    stores: sortedStoresSelector(state),
    searchQuery: querySelector(state),
    filterItems: searchFilterSelector(state),
    vendors: vendorsByCharacterSelector(state),
  });
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

/**
 * The "All Vendors" page for D2 that shows all the rotating vendors.
 */
function Vendors({ stores, searchQuery, filterItems, vendors, dispatch, account }: Props) {
  const defs = useD2Definitions();
  const isPhonePortrait = useIsPhonePortrait();
  const [filterToUnacquired, setFilterToUnacquired] = useState(false);

  // once the page is loaded, user can select this
  const [userSelectedStoreId, setUserSelectedStoreId] = useState<string>();
  // each render without a user selection, retry getting a character ID to use
  const storeId = userSelectedStoreId || getCurrentStore(stores)?.id;

  let vendorGroups = useSelector(vendorGroupsForCharacterSelector(storeId));
  const ownedItemHashes = useSelector(ownedVendorItemsSelector(storeId));

  useLoadStores(account);

  useEffect(() => {
    if (storeId) {
      dispatch(loadAllVendors(account, storeId));
    }
  }, [account, storeId, dispatch]);

  useEventBusListener(
    refresh$,
    useCallback(
      () => () => {
        if (storeId) {
          loadingTracker.addPromise(dispatch(loadAllVendors(account, storeId, true)));
        }
      },
      [account, dispatch, storeId]
    )
  );

  const handleSwipe = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Velocity is in px/ms
    if (Math.abs(info.offset.x) < 10 || Math.abs(info.velocity.x) < 300) {
      return;
    }

    const direction = -Math.sign(info.velocity.x);

    const characters = stores.filter((s) => !s.isVault);

    const selectedStoreIndex = storeId
      ? characters.findIndex((s) => s.id === storeId)
      : characters.findIndex((s) => s.current);

    if (direction > 0 && selectedStoreIndex < characters.length - 1) {
      setUserSelectedStoreId(characters[selectedStoreIndex + 1].id);
    } else if (direction < 0 && selectedStoreIndex > 0) {
      setUserSelectedStoreId(characters[selectedStoreIndex - 1].id);
    }
  };

  const vendorData = storeId ? vendors[storeId] : undefined;
  const vendorsResponse = vendorData?.vendorsResponse;

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

  const selectedStore = stores.find((s) => s.id === storeId)!;
  const currencyLookups = vendorsResponse?.currencyLookups.data?.itemQuantities;

  if (vendorGroups && filterToUnacquired) {
    vendorGroups = filterVendorGroupsToUnacquired(vendorGroups, ownedItemHashes);
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
            selectedStore={selectedStore}
            onCharacterChanged={setUserSelectedStoreId}
          />
        )}
        {selectedStore && (
          <div className={styles.buttons}>
            <CheckButton
              name="filter-to-unacquired"
              checked={filterToUnacquired}
              onChange={setFilterToUnacquired}
            >
              {t('Vendors.FilterToUnacquired')}
            </CheckButton>
          </div>
        )}
        {!isPhonePortrait && vendorGroups && <VendorsMenu groups={vendorGroups} />}
      </PageWithMenu.Menu>
      <PageWithMenu.Contents>
        <motion.div className="horizontal-swipable" onPanEnd={handleSwipe}>
          {vendorGroups && currencyLookups && defs ? (
            vendorGroups.map((group) => (
              <VendorGroup
                key={group.def.hash}
                group={group}
                ownedItemHashes={ownedItemHashes}
                currencyLookups={currencyLookups}
                filtering={filterToUnacquired || searchQuery.length > 0}
                characterId={selectedStore.id}
              />
            ))
          ) : (
            <ShowPageLoading message={t('Loading.Vendors')} />
          )}
        </motion.div>
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

function VendorGroup({
  group,
  ownedItemHashes,
  currencyLookups,
  filtering,
  characterId,
}: {
  group: D2VendorGroup;
  ownedItemHashes?: Set<number>;
  currencyLookups: DestinyCurrenciesComponent['itemQuantities'];
  filtering: boolean;
  characterId: string;
}) {
  return (
    <>
      <h2>{group.def.categoryName}</h2>
      {group.vendors.map((vendor) => (
        <ErrorBoundary key={vendor.def.hash} name="Vendor">
          <Vendor
            vendor={vendor}
            ownedItemHashes={ownedItemHashes}
            currencyLookups={currencyLookups}
            filtering={filtering}
            characterId={characterId}
          />
        </ErrorBoundary>
      ))}
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(Vendors);
