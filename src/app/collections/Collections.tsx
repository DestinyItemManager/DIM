import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React, { useEffect } from 'react';
import _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import './collections.scss';
import { t } from 'app/i18next-t';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService } from '../inventory/d2-stores';
import { UIViewInjectedProps } from '@uirouter/react';
import Catalysts from './Catalysts';
import { Loading } from '../dim-ui/Loading';
import { connect } from 'react-redux';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { RootState } from '../store/reducers';
import { createSelector } from 'reselect';
import { storesSelector, profileResponseSelector } from '../inventory/reducer';
import { refresh$ } from '../shell/refresh';
import PresentationNodeRoot from './PresentationNodeRoot';
import Mods from './Mods';
import { useSubscription } from 'app/utils/hooks';

interface ProvidedProps extends UIViewInjectedProps {
  account: DestinyAccount;
}

interface StoreProps {
  buckets?: InventoryBuckets;
  defs?: D2ManifestDefinitions;
  ownedItemHashes: Set<number>;
  presentationNodeHash?: number;
  profileResponse?: DestinyProfileResponse;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  const ownedItemHashesSelector = createSelector(storesSelector, (stores) => {
    const ownedItemHashes = new Set<number>();
    if (stores) {
      for (const store of stores) {
        for (const item of store.items) {
          ownedItemHashes.add(item.hash);
        }
      }
    }
    return ownedItemHashes;
  });

  return (state: RootState, ownProps: ProvidedProps): StoreProps => ({
    buckets: state.inventory.buckets,
    defs: state.manifest.d2Manifest,
    ownedItemHashes: ownedItemHashesSelector(state),
    presentationNodeHash: ownProps.transition?.params().presentationNodeHash,
    profileResponse: profileResponseSelector(state)
  });
}

const refreshStores = () =>
  refresh$.subscribe(() => {
    D2StoresService.reloadStores();
  });

/**
 * The collections screen that shows items you can get back from the vault, like emblems and exotics.
 */
function Collections({
  account,
  buckets,
  ownedItemHashes,
  transition,
  defs,
  profileResponse
}: Props) {
  useEffect(() => {
    D2StoresService.getStoresStream(account);
  }, [account]);

  useSubscription(refreshStores);

  if (!profileResponse || !defs || !buckets) {
    return (
      <div className="vendor d2-vendors dim-page">
        <Loading />
      </div>
    );
  }

  const presentationNodeHash = transition?.params().presentationNodeHash;

  return (
    <div className="vendor d2-vendors dim-page">
      <ErrorBoundary name="Catalysts">
        <Catalysts defs={defs} profileResponse={profileResponse} />
      </ErrorBoundary>
      <ErrorBoundary name="Mods">
        <Mods profileResponse={profileResponse} />
      </ErrorBoundary>
      <ErrorBoundary name="Collections">
        <PresentationNodeRoot
          presentationNodeHash={3790247699}
          defs={defs}
          profileResponse={profileResponse}
          buckets={buckets}
          ownedItemHashes={ownedItemHashes}
          openedPresentationHash={presentationNodeHash}
          showPlugSets={true}
        />
        <PresentationNodeRoot
          presentationNodeHash={498211331}
          defs={defs}
          profileResponse={profileResponse}
          buckets={buckets}
          ownedItemHashes={ownedItemHashes}
          openedPresentationHash={presentationNodeHash}
        />
      </ErrorBoundary>
      <div className="collections-partners">
        <a
          className="collections-partner dim-button"
          target="_blank"
          rel="noopener"
          href="https://destinysets.com"
        >
          {t('Vendors.DestinySets')}
        </a>
        <a
          className="collections-partner dim-button"
          target="_blank"
          rel="noopener"
          href="https://lowlidev.com.au/destiny/maps"
        >
          {t('Vendors.DestinyMap')}
        </a>
      </div>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(Collections);
