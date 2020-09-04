import React from 'react';
import _ from 'lodash';
import './collections.scss';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import Catalysts from './Catalysts';
import { connect } from 'react-redux';
import { RootState } from 'app/store/types';
import { createSelector } from 'reselect';
import { storesSelector } from '../inventory/selectors';
import PresentationNodeRoot from './PresentationNodeRoot';
import { useParams } from 'react-router';
import withStoresLoader from 'app/utils/withStoresLoader';
import type { StoresLoadedProps } from 'app/utils/withStoresLoader';

interface StoreProps {
  ownedItemHashes: Set<number>;
}

type Props = StoresLoadedProps & StoreProps;

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
    ownedItemHashes: ownedItemHashesSelector(state),
  });
}

/**
 * The collections screen that shows items you can get back from the vault, like emblems and exotics.
 */
function Collections({ buckets, ownedItemHashes, defs, profileInfo }: Props) {
  const { presentationNodeHashStr } = useParams<{ presentationNodeHashStr: string }>();

  if (defs.isDestiny1()) {
    return null;
  }

  const presentationNodeHash = presentationNodeHashStr
    ? parseInt(presentationNodeHashStr, 10)
    : undefined;

  const badgesRootNodeHash = profileInfo.profileCollectibles?.data?.collectionBadgesRootNodeHash;
  const metricsRootNodeHash = profileInfo.metrics?.data?.metricsRootNodeHash;

  return (
    <div className="collections-page d2-vendors dim-page">
      <ErrorBoundary name="Catalysts">
        <Catalysts defs={defs} profileResponse={profileInfo} />
      </ErrorBoundary>
      <ErrorBoundary name="Collections">
        <PresentationNodeRoot
          presentationNodeHash={3790247699}
          defs={defs}
          profileResponse={profileInfo}
          buckets={buckets}
          ownedItemHashes={ownedItemHashes}
          openedPresentationHash={presentationNodeHash}
          showPlugSets={true}
        />
        {badgesRootNodeHash && (
          <PresentationNodeRoot
            presentationNodeHash={badgesRootNodeHash}
            defs={defs}
            profileResponse={profileInfo}
            buckets={buckets}
            ownedItemHashes={ownedItemHashes}
            openedPresentationHash={presentationNodeHash}
          />
        )}
        {metricsRootNodeHash && (
          <PresentationNodeRoot
            presentationNodeHash={metricsRootNodeHash}
            defs={defs}
            profileResponse={profileInfo}
            buckets={buckets}
            ownedItemHashes={ownedItemHashes}
            openedPresentationHash={presentationNodeHash}
          />
        )}
      </ErrorBoundary>
    </div>
  );
}

export default withStoresLoader(connect<StoreProps>(mapStateToProps)(Collections));
