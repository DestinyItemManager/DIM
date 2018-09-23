import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { createSelector } from 'reselect';
import { storesSelector } from '../inventory/reducer';
import { RootState } from '../store/reducers';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import { DimStore } from '../inventory/store-types';
import { connect } from 'react-redux';
import { $rootScope } from 'ngimport';
import './Collectible.scss';
import { D2ManifestService } from '../manifest/manifest-service';
import { getCollections } from '../bungie-api/destiny2-api';
import { loadingTracker } from '../ngimport-more';
import { D2StoresService } from '../inventory/d2-stores.service';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import PresentationNode from './PresentationNode';
import { Loading } from '../dim-ui/Loading';
import { Transition } from '@uirouter/react';

interface ProvidedProps {
  account: DestinyAccount;
  transition: Transition;
}

interface StoreProps {
  buckets?: InventoryBuckets;
  ownedItemHashes: Set<number>;
}

type Props = ProvidedProps & StoreProps;

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

function mapStateToProps(state: RootState): StoreProps {
  return {
    buckets: state.inventory.buckets,
    ownedItemHashes: ownedItemHashesSelector(state)
  };
}

interface State {
  defs?: D2ManifestDefinitions;
  profileResponse?: DestinyProfileResponse;
  trackerService?: DestinyTrackerService;
  stores?: DimStore[];
}

class SinglePresentationNode extends React.Component<Props, State> {
  private $scope = $rootScope.$new(true);

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  async loadCollections() {
    // TODO: don't really have to serialize these...

    // TODO: put defs in redux
    // TODO: defs as a property, not state
    const defs = await getDefinitions();
    D2ManifestService.loaded = true;

    const profileResponse = await getCollections(this.props.account);

    // TODO: put collectibles in redux
    // TODO: convert collectibles into DimItems

    this.setState({ profileResponse, defs });
  }

  componentDidMount() {
    loadingTracker.addPromise(this.loadCollections());

    // We need to make a scope
    this.$scope.$on('dim-refresh', () => {
      loadingTracker.addPromise(this.loadCollections());
    });

    D2StoresService.getStoresStream(this.props.account);
  }

  componentWillUnmount() {
    this.$scope.$destroy();
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

    return (
      <div className="vendor d2-vendors dim-page">
        <ErrorBoundary name="Collections">
          <PresentationNode
            presentationNodeHash={transition.params().presentationNodeHash}
            defs={defs}
            profileResponse={profileResponse}
            buckets={buckets}
            ownedItemHashes={ownedItemHashes}
            path={[]}
          />
        </ErrorBoundary>
      </div>
    );
  }
}

export default connect<StoreProps>(mapStateToProps)(SinglePresentationNode);
