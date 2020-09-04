import React, { useEffect } from 'react';
import { t } from 'app/i18next-t';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { D1StoresService } from 'app/inventory/d1-stores';
import { D2StoresService } from 'app/inventory/d2-stores';
import { DestinyComponentType, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { useSubscription } from './hooks';
import { refresh$ } from 'app/shell/refresh';
import { queueAction } from 'app/inventory/action-queue';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { connect } from 'react-redux';
import { RootState } from 'app/store/types';
import { storesSelector, bucketsSelector, profileResponseSelector } from 'app/inventory/selectors';
import { currentAccountSelector, destinyVersionSelector } from 'app/accounts/selectors';
import type { DimStore } from 'app/inventory/store-types';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { DestinyVersion } from '@destinyitemmanager/dim-api-types';

export interface StoresLoadedProps {
  destinyVersion: DestinyVersion;
  account: DestinyAccount;
  profileInfo: DestinyProfileResponse;
  defs: D2ManifestDefinitions | D1ManifestDefinitions;
  defsD2: D2ManifestDefinitions;
  stores: DimStore[];
  buckets: InventoryBuckets;
  isPhonePortrait: boolean;
}

function mapStateToProps(state: RootState): StoresLoadedProps {
  const destinyVersion = destinyVersionSelector(state);

  return {
    destinyVersion,
    account: currentAccountSelector(state)!,
    profileInfo: profileResponseSelector(state)!,
    defs: destinyVersion === 2 ? state.manifest.d2Manifest! : state.manifest.d1Manifest!,
    defsD2: state.manifest.d2Manifest!,
    stores: storesSelector(state),
    buckets: bucketsSelector(state)!,
    isPhonePortrait: state.shell.isPhonePortrait,
  };
}

function getStoresService(account: DestinyAccount) {
  return account.destinyVersion === 1 ? D1StoresService : D2StoresService;
}

/**
 * Wraps a component and will preload account/profile/store information.
 * Optionally provide components for a paired down request (otherwise fetches all)
 */
export default function withStoresLoader(WrappedComponent, components?: DestinyComponentType[]) {
  function LoadedComponent(props: StoresLoadedProps & any) {
    const { account, stores } = props;

    useEffect(() => {
      const storesService = getStoresService(account);
      if (!stores.length) {
        // TODO: Dispatch an action to load stores instead
        storesService.getStoresStream(account, components);
      }
    }, [account, stores.length]);

    useSubscription(() => {
      const storesService = getStoresService(account);
      return refresh$.subscribe(() => queueAction(() => storesService.reloadStores()));
    });

    if (!stores.length) {
      return <ShowPageLoading message={t('Loading.Profile')} />;
    }

    return <WrappedComponent {...props} />;
  }

  return connect<StoresLoadedProps>(mapStateToProps)(LoadedComponent);
}
