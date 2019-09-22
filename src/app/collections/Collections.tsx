import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React from 'react';
import _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getCollections } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import './collections.scss';
import { DimStore } from '../inventory/store-types';
import { t } from 'app/i18next-t';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService } from '../inventory/d2-stores.service';
import { UIViewInjectedProps } from '@uirouter/react';
import { loadingTracker } from '../shell/loading-tracker';
import Catalysts from './Catalysts';
import { Loading } from '../dim-ui/Loading';
import { connect } from 'react-redux';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { RootState } from '../store/reducers';
import { createSelector } from 'reselect';
import { storesSelector } from '../inventory/reducer';
import { Subscriptions } from '../utils/rx-utils';
import { refresh$ } from '../shell/refresh';
import PresentationNodeRoot from './PresentationNodeRoot';

interface ProvidedProps extends UIViewInjectedProps {
  account: DestinyAccount;
}

interface StoreProps {
  buckets?: InventoryBuckets;
  defs?: D2ManifestDefinitions;
  stores: DimStore[];
  ownedItemHashes: Set<number>;
  presentationNodeHash?: number;
}

type Props = ProvidedProps & StoreProps;

const ownedItemHashesSelector = createSelector(
  storesSelector,
  (stores) => {
    const ownedItemHashes = new Set<number>();
    if (stores) {
      for (const store of stores) {
        for (const item of store.items) {
          ownedItemHashes.add(item.hash);
        }
      }
    }
    return ownedItemHashes;
  }
);

function mapStateToProps(state: RootState, ownProps: ProvidedProps): StoreProps {
  return {
    buckets: state.inventory.buckets,
    defs: state.manifest.d2Manifest,
    stores: storesSelector(state),
    ownedItemHashes: ownedItemHashesSelector(state),
    presentationNodeHash: ownProps.transition && ownProps.transition.params().presentationNodeHash
  };
}

interface State {
  profileResponse?: DestinyProfileResponse;
}

/**
 * The collections screen that shows items you can get back from the vault, like emblems and exotics.
 */
class Collections extends React.Component<Props, State> {
  private subscriptions = new Subscriptions();

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  async loadCollections() {
    if (!this.props.defs) {
      getDefinitions();
    }

    const profileResponse = await getCollections(this.props.account);

    // TODO: put collectibles in redux
    // TODO: convert collectibles into DimItems
    // TODO: bring back ratings for collections

    this.setState({ profileResponse });
  }

  componentDidMount() {
    loadingTracker.addPromise(this.loadCollections());

    this.subscriptions.add(
      refresh$.subscribe(() => {
        // TODO: refresh just advisors
        D2StoresService.reloadStores();
      })
    );
    D2StoresService.getStoresStream(this.props.account);
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { buckets, ownedItemHashes, transition, defs } = this.props;
    const { profileResponse } = this.state;

    if (!profileResponse || !defs || !buckets) {
      return (
        <div className="vendor d2-vendors dim-page">
          <Loading />
        </div>
      );
    }

    // TODO: a lot of this processing should happen at setState, not render?

    const plugSetHashes = new Set(
      profileResponse.profilePlugSets.data
        ? Object.keys(profileResponse.profilePlugSets.data.plugs)
        : []
    );
    if (profileResponse.characterPlugSets.data) {
      _.forIn(profileResponse.characterPlugSets.data, (plugSet) => {
        Object.keys(plugSet.plugs).forEach((plugSetHash) => {
          plugSetHashes.add(plugSetHash);
        });
      });
    }

    const presentationNodeHash = transition && transition.params().presentationNodeHash;

    return (
      <div className="vendor d2-vendors dim-page">
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
            plugSetHashes={plugSetHashes}
            openedPresentationHash={presentationNodeHash}
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
}

export default connect<StoreProps>(mapStateToProps)(Collections);
