import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React, { useEffect } from 'react';
import _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import './collections.scss';
import { t } from 'app/i18next-t';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService } from '../inventory/d2-stores';
import Catalysts from './Catalysts';
import { connect } from 'react-redux';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { RootState } from 'app/store/types';
import { createSelector } from 'reselect';
import { storesSelector, profileResponseSelector, bucketsSelector } from '../inventory/selectors';
import { refresh$ } from '../shell/refresh';
import PresentationNodeRoot from './PresentationNodeRoot';
import { useSubscription } from 'app/utils/hooks';
import { useParams } from 'react-router';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  buckets?: InventoryBuckets;
  defs?: D2ManifestDefinitions;
  ownedItemHashes: Set<number>;
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

  return (state: RootState): StoreProps => ({
    buckets: bucketsSelector(state),
    defs: state.manifest.d2Manifest,
    ownedItemHashes: ownedItemHashesSelector(state),
    profileResponse: profileResponseSelector(state),
  });
}

const refreshStores = () =>
  refresh$.subscribe(() => {
    D2StoresService.reloadStores();
  });

/**
 * The collections screen that shows items you can get back from the vault, like emblems and exotics.
 */
function Collections({ account, buckets, ownedItemHashes, defs, profileResponse }: Props) {
  useEffect(() => {
    D2StoresService.getStoresStream(account);
  }, [account]);

  useSubscription(refreshStores);

  const { presentationNodeHashStr } = useParams();
  const presentationNodeHash = presentationNodeHashStr
    ? parseInt(presentationNodeHashStr, 10)
    : undefined;

  if (!profileResponse || !defs || !buckets) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  const badgesRootNodeHash =
    profileResponse.profileCollectibles?.data?.collectionBadgesRootNodeHash;
  const metricsRootNodeHash = profileResponse.metrics?.data?.metricsRootNodeHash;

  return (
    <div className="collections-page d2-vendors dim-page">
      <ErrorBoundary name="Catalysts">
        <Catalysts defs={defs} profileResponse={profileResponse} />
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
        {badgesRootNodeHash && (
          <PresentationNodeRoot
            presentationNodeHash={badgesRootNodeHash}
            defs={defs}
            profileResponse={profileResponse}
            buckets={buckets}
            ownedItemHashes={ownedItemHashes}
            openedPresentationHash={presentationNodeHash}
          />
        )}
        {metricsRootNodeHash && (
          <PresentationNodeRoot
            presentationNodeHash={metricsRootNodeHash}
            defs={defs}
            profileResponse={profileResponse}
            buckets={buckets}
            ownedItemHashes={ownedItemHashes}
            openedPresentationHash={presentationNodeHash}
          />
        )}
      </ErrorBoundary>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(Collections);
