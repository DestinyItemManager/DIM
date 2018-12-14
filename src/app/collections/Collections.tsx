import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getCollections } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import { D2ManifestService } from '../manifest/manifest-service-json';
import './collections.scss';
import { DimStore } from '../inventory/store-types';
import { t } from 'i18next';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import Ornaments from './Ornaments';
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
import { Subscriptions } from '../rx-utils';
import { refresh$ } from '../shell/refresh';
import PresentationNodeRoot from './PresentationNodeRoot';

interface ProvidedProps extends UIViewInjectedProps {
  account: DestinyAccount;
}

interface StoreProps {
  buckets?: InventoryBuckets;
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
    ownedItemHashes: ownedItemHashesSelector(state),
    presentationNodeHash: ownProps.transition && ownProps.transition.params().presentationNodeHash
  };
}

interface State {
  defs?: D2ManifestDefinitions;
  profileResponse?: DestinyProfileResponse;
  stores?: DimStore[];
  ownedItemHashes?: Set<number>;
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
    // TODO: don't really have to serialize these...

    // TODO: defs as a property, not state
    const defs = await getDefinitions();
    D2ManifestService.loaded = true;

    const profileResponse = await getCollections(this.props.account);

    // TODO: put collectibles in redux
    // TODO: convert collectibles into DimItems
    // TODO: bring back ratings for collections

    this.setState({ profileResponse, defs });
  }

  componentDidMount() {
    loadingTracker.addPromise(this.loadCollections());

    this.subscriptions.add(
      refresh$.subscribe(() => {
        // TODO: refresh just advisors
        D2StoresService.reloadStores();
      }),
      D2StoresService.getStoresStream(this.props.account).subscribe((stores) => {
        if (stores) {
          const ownedItemHashes = new Set<number>();
          for (const store of stores) {
            for (const item of store.items) {
              ownedItemHashes.add(item.hash);
            }
          }
          this.setState({ stores, ownedItemHashes });
        }
      })
    );
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { buckets, ownedItemHashes, transition } = this.props;
    const { defs, profileResponse } = this.state;

    if (!profileResponse || !defs || !buckets) {
      return (
        <div className="vendor d2-vendors dim-page">
          <Loading />
        </div>
      );
    }

    // TODO: a lot of this processing should happen at setState, not render?

    const plugSetHashes = new Set(Object.keys(profileResponse.profilePlugSets.data.plugs));
    _.each(profileResponse.characterPlugSets.data, (plugSet) => {
      _.each(plugSet.plugs, (_, plugSetHash) => {
        plugSetHashes.add(plugSetHash);
      });
    });

    const presentationNodeHash = transition && transition.params().presentationNodeHash;

    return (
      <div className="vendor d2-vendors dim-page">
        <ErrorBoundary name="Catalysts">
          <Catalysts defs={defs} buckets={buckets} profileResponse={profileResponse} />
        </ErrorBoundary>
        <ErrorBoundary name="Ornaments">
          <Ornaments defs={defs} buckets={buckets} profileResponse={profileResponse} />
        </ErrorBoundary>
        <ErrorBoundary name="Collections">
          <div className="vendor-row no-badge">
            <h3 className="category-title">{t('Vendors.Collections')}</h3>
            <PresentationNodeRoot
              presentationNodeHash={3790247699}
              defs={defs}
              profileResponse={profileResponse}
              buckets={buckets}
              ownedItemHashes={ownedItemHashes}
              plugSetHashes={plugSetHashes}
              openedPresentationHash={presentationNodeHash}
            />
          </div>
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
