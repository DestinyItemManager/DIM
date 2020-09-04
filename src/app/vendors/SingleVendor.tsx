import React, { useEffect } from 'react';
import Countdown from '../dim-ui/Countdown';
import VendorItems from './VendorItems';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService, mergeCollectibles } from '../inventory/d2-stores';
import { loadingTracker } from '../shell/loading-tracker';
import { refresh$ } from '../shell/refresh';
import { connect } from 'react-redux';
import { ownedItemsSelector } from '../inventory/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { toVendor } from './d2-vendors';
import styles from './SingleVendor.m.scss';
import vendorStyles from './Vendor.m.scss';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { useLocation } from 'react-router';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useSubscription } from 'app/utils/hooks';
import clsx from 'clsx';
import { VendorsState } from './reducer';
import { loadAllVendors } from './actions';
import ErrorPanel from 'app/shell/ErrorPanel';
import withStoresLoader from 'app/utils/withStoresLoader';
import type { StoresLoadedProps } from 'app/utils/withStoresLoader';

interface ProvidedProps {
  vendorHash: number;
}

interface StoreProps {
  ownedItemHashes: Set<number>;
  vendors: VendorsState['vendorsByCharacter'];
}

function mapStateToProps() {
  const ownedItemSelectorInstance = ownedItemsSelector();
  return (state: RootState): StoreProps => ({
    ownedItemHashes: ownedItemSelectorInstance(state),
    vendors: state.vendors.vendorsByCharacter,
  });
}

type Props = ProvidedProps & StoresLoadedProps & StoreProps & ThunkDispatchProp;

/**
 * A page that loads its own info for a single vendor, so we can link to a vendor or show engram previews.
 */
function SingleVendor({
  account,
  stores,
  buckets,
  ownedItemHashes,
  defsD2: defs,
  profileInfo,
  vendorHash,
  dispatch,
  vendors,
}: Props) {
  const { search } = useLocation();

  // TODO: get for all characters, or let people select a character? This is a hack
  // we at least need to display that character!
  const characterId =
    (search && new URLSearchParams(search).get('characterId')) ||
    (stores.length && getCurrentStore(stores)?.id);
  if (!characterId) {
    throw new Error('no characters chosen or found to use for vendor API call');
  }

  const vendorData = characterId ? vendors[characterId] : undefined;
  const vendorResponse = vendorData?.vendorsResponse;

  useSubscription(() =>
    refresh$.subscribe(() => {
      if (defs?.Vendor.get(vendorHash)?.returnWithVendorRequest) {
        loadingTracker.addPromise(dispatch(loadAllVendors(account, characterId)));
      }
    })
  );

  useEffect(() => {
    if (characterId && defs?.Vendor.get(vendorHash)?.returnWithVendorRequest) {
      dispatch(loadAllVendors(account, characterId));
    }
  }, [account, characterId, defs, dispatch, vendorHash]);

  useEffect(() => {
    D2StoresService.getStoresStream(account);
  }, [account]);

  if (!defs || !buckets) {
    return <ShowPageLoading message={t('Manifest.Load')} />;
  }

  const vendorDef = defs.Vendor.get(vendorHash);
  if (!vendorDef) {
    return <ErrorPanel error={new Error(`No known vendor with hash ${vendorHash}`)} />;
  }

  if (vendorData?.error) {
    return <ErrorPanel error={vendorData.error} />;
  }
  if (vendorDef.returnWithVendorRequest) {
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

  const mergedCollectibles = profileInfo
    ? mergeCollectibles(profileInfo.profileCollectibles, profileInfo.characterCollectibles)
    : {};

  const d2Vendor = toVendor(
    vendorHash,
    defs,
    buckets,
    vendor,
    account,
    vendorResponse?.itemComponents[vendorHash],
    vendorResponse?.sales.data?.[vendorHash]?.saleItems,
    mergedCollectibles
  );

  if (!d2Vendor) {
    return <ErrorPanel error={new Error(`No known vendor with hash ${vendorHash}`)} />;
  }

  return (
    <div className={clsx(styles.page, 'dim-page')}>
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
          characterId={characterId}
        />
      </ErrorBoundary>
    </div>
  );
}

export default withStoresLoader(connect<StoreProps>(mapStateToProps)(SingleVendor));
