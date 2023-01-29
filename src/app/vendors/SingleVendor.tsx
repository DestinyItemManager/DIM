import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { useD2Definitions } from 'app/manifest/selectors';
import ErrorPanel from 'app/shell/ErrorPanel';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import clsx from 'clsx';
import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router';
import { DestinyAccount } from '../accounts/destiny-account';
import Countdown from '../dim-ui/Countdown';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import {
  bucketsSelector,
  createItemContextSelector,
  profileResponseSelector,
  storesSelector,
} from '../inventory/selectors';
import { loadingTracker } from '../shell/loading-tracker';
import { refresh$ } from '../shell/refresh-events';
import { loadAllVendors } from './actions';
import { toVendor } from './d2-vendors';
import { ownedVendorItemsSelector, vendorsByCharacterSelector } from './selectors';
import styles from './SingleVendor.m.scss';
import { VendorLocation } from './Vendor';
import VendorItems from './VendorItems';

/**
 * A page that loads its own info for a single vendor, so we can link to a vendor or show engram previews.
 */
export default function SingleVendor({ account }: { account: DestinyAccount }) {
  const { vendorHash: vendorHashString } = useParams();
  const vendorHash = parseInt(vendorHashString ?? '', 10);
  const { search } = useLocation();
  const stores = useSelector(storesSelector);
  const buckets = useSelector(bucketsSelector);
  const profileResponse = useSelector(profileResponseSelector);
  const vendors = useSelector(vendorsByCharacterSelector);
  const defs = useD2Definitions();
  const createItemContext = useSelector(createItemContextSelector);
  const dispatch = useThunkDispatch();

  // TODO: get for all characters, or let people select a character? This is a hack
  // we at least need to display that character!
  const characterId =
    (search && new URLSearchParams(search).get('characterId')) ||
    (stores.length && getCurrentStore(stores)?.id);
  if (!characterId) {
    throw new Error('no characters chosen or found to use for vendor API call');
  }

  const ownedItemHashes = useSelector(ownedVendorItemsSelector(characterId));

  const vendorData = characterId ? vendors[characterId] : undefined;
  const vendorResponse = vendorData?.vendorsResponse;

  const vendorDef = defs?.Vendor.get(vendorHash);
  const returnWithVendorRequest = vendorDef?.returnWithVendorRequest;
  useEventBusListener(
    refresh$,
    useCallback(() => {
      if (returnWithVendorRequest) {
        loadingTracker.addPromise(dispatch(loadAllVendors(account, characterId)));
      }
    }, [account, characterId, dispatch, returnWithVendorRequest])
  );

  useEffect(() => {
    if (characterId && vendorDef?.returnWithVendorRequest) {
      dispatch(loadAllVendors(account, characterId));
    }
  }, [account, characterId, vendorDef, dispatch, vendorHash]);

  useLoadStores(account);

  if (!defs || !buckets) {
    return <ShowPageLoading message={t('Manifest.Load')} />;
  }

  if (!vendorDef) {
    return <ErrorPanel error={new Error(`No known vendor with hash ${vendorHash}`)} />;
  }

  if (vendorData?.error) {
    return <ErrorPanel error={vendorData.error} />;
  }
  if (vendorDef.returnWithVendorRequest) {
    if (!profileResponse) {
      return <ShowPageLoading message={t('Loading.Profile')} />;
    }
    if (!vendorResponse) {
      return <ShowPageLoading message={t('Loading.Vendors')} />;
    }
  }

  // TODO:
  // * featured item
  // * enabled
  // * filter by character class
  // * load all classes?
  const vendor = vendorResponse?.vendors.data?.[vendorHash];

  const destinationDef =
    vendor?.vendorLocationIndex && vendorDef.locations[vendor.vendorLocationIndex]
      ? defs.Destination.get(vendorDef.locations[vendor.vendorLocationIndex].destinationHash)
      : undefined;
  const placeDef = destinationDef && defs.Place.get(destinationDef.placeHash);

  const placeString = [destinationDef?.displayProperties.name, placeDef?.displayProperties.name]
    .filter((n) => n?.length)
    .join(', ');
  // TODO: there's a cool background image but I'm not sure how to use it

  const d2Vendor = toVendor(
    { ...createItemContext, itemComponents: vendorResponse?.itemComponents[vendorHash] },
    vendorHash,
    vendor,
    characterId,
    vendorResponse?.sales.data?.[vendorHash]?.saleItems
  );

  if (!d2Vendor) {
    return <ErrorPanel error={new Error(`No known vendor with hash ${vendorHash}`)} />;
  }

  let displayName = d2Vendor.def.displayProperties.name;
  let displayDesc = d2Vendor.def.displayProperties.description;
  let artifactCheck: string | undefined;

  // if this vendor is the seasonal artifact
  if (vendorDef.displayCategories.find((c) => c.identifier === 'category_reset')) {
    // search for the associated item. this is way harder than it should be, but we have what we are given
    const seasonHash = profileResponse?.profile.data?.currentSeasonHash;
    const artifactDisplay = Object.values(defs.InventoryItem.getAll()).find(
      (i) =>
        // belongs to the current season,                         and looks like an artifact
        i.seasonHash === seasonHash && /\.artifacts?\./.test(i.inventory!.stackUniqueLabel ?? '')
    )?.displayProperties;
    if (artifactDisplay) {
      displayName = artifactDisplay.name;
      displayDesc = artifactDisplay.description;
      artifactCheck = 'seasonalArtifact';
    }
  }

  let refreshTime = d2Vendor.component && new Date(d2Vendor.component.nextRefreshDate);
  if (refreshTime?.getFullYear() === 9999) {
    refreshTime = undefined;
  }

  return (
    <div className={clsx(styles.page, 'dim-page', artifactCheck)}>
      <ErrorBoundary name="SingleVendor">
        <div className={styles.featuredHeader}>
          <h1>
            {displayName} <VendorLocation>{placeString}</VendorLocation>
          </h1>
          <div>{displayDesc}</div>
          {refreshTime && (
            <div>
              {t('Vendors.RefreshTime')} <Countdown endTime={refreshTime} />
            </div>
          )}
        </div>
        <VendorItems
          vendor={d2Vendor}
          ownedItemHashes={ownedItemHashes}
          currencyLookups={vendorResponse?.currencyLookups.data?.itemQuantities ?? {}}
          characterId={characterId}
        />
      </ErrorBoundary>
    </div>
  );
}
