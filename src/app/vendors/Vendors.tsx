import CheckButton from 'app/dim-ui/CheckButton';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { useD2Definitions } from 'app/manifest/selectors';
import { useSetting } from 'app/settings/hooks';
import ErrorPanel from 'app/shell/ErrorPanel';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { usePageTitle } from 'app/utils/hooks';
import { DestinyCurrenciesComponent } from 'bungie-api-ts/destiny2';
import { PanInfo, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import CharacterSelect from '../dim-ui/CharacterSelect';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { sortedStoresSelector } from '../inventory/selectors';
import Vendor from './Vendor';
import styles from './Vendors.m.scss';
import VendorsMenu from './VendorsMenu';
import { setShowUnacquiredOnly } from './actions';
import { D2VendorGroup, filterVendorGroups } from './d2-vendors';
import { useLoadVendors } from './hooks';
import {
  ownedVendorItemsSelector,
  showUnacquiredVendorItemsOnlySelector,
  vendorGroupsForCharacterSelector,
  vendorItemFilterSelector,
  vendorsByCharacterSelector,
} from './selectors';
import { hideVendorSheet } from './single-vendor/single-vendor-sheet';

/**
 * The "All Vendors" page for D2 that shows all the rotating vendors.
 */
export default function Vendors({ account }: { account: DestinyAccount }) {
  const defs = useD2Definitions();
  const dispatch = useThunkDispatch();
  const isPhonePortrait = useIsPhonePortrait();
  const stores = useSelector(sortedStoresSelector);
  const vendors = useSelector(vendorsByCharacterSelector);
  usePageTitle(t('Vendors.Vendors'));

  const shouldFilterToUnacquired = useSelector(showUnacquiredVendorItemsOnlySelector);
  const [hideSilverItems, setHideSilverItems] = useSetting('vendorsHideSilverItems');

  // once the page is loaded, user can select this
  const [userSelectedStoreId, setUserSelectedStoreId] = useState<string>();
  // each render without a user selection, retry getting a character ID to use
  const storeId = userSelectedStoreId || getCurrentStore(stores)?.id;

  let vendorGroups = useSelector(vendorGroupsForCharacterSelector(storeId));
  const ownedItemHashes = useSelector(ownedVendorItemsSelector(storeId));

  const vendorFilter = useSelector(vendorItemFilterSelector(storeId));

  useLoadStores(account);
  useLoadVendors(account, storeId);

  // Hide the vendor sheets when switching characters
  useEffect(() => {
    hideVendorSheet();
  }, [storeId]);

  // Turn off "show unacquired only" when leaving Vendors page
  // to prevent it from applying to artifact on the Inventory page
  useEffect(
    () => () => {
      dispatch(setShowUnacquiredOnly(false));
    },
    [dispatch],
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
      <div className="dim-page">
        <ErrorPanel error={vendorData.error} />
      </div>
    );
  }

  if (!stores.length) {
    return (
      <div className="dim-page">
        <ShowPageLoading message={t('Loading.Profile')} />
      </div>
    );
  }

  const selectedStore = stores.find((s) => s.id === storeId)!;
  const currencyLookups = vendorsResponse?.currencyLookups.data?.itemQuantities;

  vendorGroups = filterVendorGroups(vendorGroups, vendorFilter);

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
              checked={shouldFilterToUnacquired}
              onChange={(val) => dispatch(setShowUnacquiredOnly(val))}
            >
              {t('Vendors.FilterToUnacquired')}
            </CheckButton>
            <CheckButton
              name="vendorsHideSilverItems"
              checked={hideSilverItems}
              onChange={setHideSilverItems}
            >
              {t('Vendors.HideSilverItems')}
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
  characterId,
}: {
  group: D2VendorGroup;
  ownedItemHashes?: Set<number>;
  currencyLookups: DestinyCurrenciesComponent['itemQuantities'];
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
            characterId={characterId}
          />
        </ErrorBoundary>
      ))}
    </>
  );
}
