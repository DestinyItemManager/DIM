import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { d2ManifestSelector } from 'app/manifest/selectors';
import ErrorPanel from 'app/shell/ErrorPanel';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { useEventBusListener } from 'app/utils/hooks';
import { DestinyCollectibleComponent, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React, { useCallback, useEffect } from 'react';
import { connect, useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router';
import { DestinyAccount } from '../accounts/destiny-account';
import Countdown from '../dim-ui/Countdown';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { bucketsSelector, profileResponseSelector, storesSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { loadingTracker } from '../shell/loading-tracker';
import { refresh$ } from '../shell/refresh-events';
import { loadAllVendors } from './actions';
import { toVendor } from './d2-vendors';
import type { VendorsState } from './reducer';
import {
  mergedCollectiblesSelector,
  ownedVendorItemsSelector,
  vendorsByCharacterSelector,
} from './selectors';
import styles from './SingleVendor.m.scss';
import { VendorLocation } from './Vendor';
import VendorItems from './VendorItems';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  stores: DimStore[];
  buckets?: InventoryBuckets;
  profileResponse?: DestinyProfileResponse;
  vendors: VendorsState['vendorsByCharacter'];
  defs?: D2ManifestDefinitions;
  mergedCollectibles: {
    [x: number]: DestinyCollectibleComponent;
  };
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    stores: storesSelector(state),
    buckets: bucketsSelector(state),
    profileResponse: profileResponseSelector(state),
    vendors: vendorsByCharacterSelector(state),
    defs: d2ManifestSelector(state),
    mergedCollectibles: mergedCollectiblesSelector(state),
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

/**
 * A page that loads its own info for a single vendor, so we can link to a vendor or show engram previews.
 */
function SingleVendor({
  account,
  stores,
  buckets,
  profileResponse,
  dispatch,
  vendors,
  defs,
  mergedCollectibles,
}: Props) {
  const { vendorHash: vendorHashString } = useParams();
  const vendorHash = parseInt(vendorHashString ?? '', 10);
  const { search } = useLocation();

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
    vendorHash,
    defs,
    buckets,
    vendor,
    account,
    characterId,
    vendorResponse?.itemComponents[vendorHash],
    vendorResponse?.sales.data?.[vendorHash]?.saleItems,
    mergedCollectibles
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

  return (
    <div className={clsx(styles.page, 'dim-page', artifactCheck)}>
      <ErrorBoundary name="SingleVendor">
        <div className={styles.featuredHeader}>
          <h1>
            {displayName} <VendorLocation>{placeString}</VendorLocation>
          </h1>
          <div>{displayDesc}</div>
          {d2Vendor.component && (
            <div>
              Inventory updates in{' '}
              <Countdown endTime={new Date(d2Vendor.component.nextRefreshDate)} />
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

export default connect<StoreProps>(mapStateToProps)(SingleVendor);
