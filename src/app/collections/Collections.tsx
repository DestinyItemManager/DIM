import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'underscore';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getCollections } from '../bungie-api/destiny2-api';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import { D2ManifestService } from '../manifest/manifest-service';
import './collections.scss';
import { DimStore } from '../inventory/store-types';
import { t } from 'i18next';
import PlugSet from './PlugSet';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import Ornaments from './Ornaments';
import { D2StoresService } from '../inventory/d2-stores.service';
import { UIViewInjectedProps } from '@uirouter/react';
import { loadingTracker } from '../ngimport-more';
import { $rootScope } from 'ngimport';
import Catalysts from './Catalysts';
import { Loading } from '../dim-ui/Loading';
import PresentationNode from './PresentationNode';
import { connect } from 'react-redux';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { RootState } from '../store/reducers';
import { createSelector } from 'reselect';
import { storesSelector } from '../inventory/reducer';

interface ProvidedProps extends UIViewInjectedProps {
  account: DestinyAccount;
}

interface StoreProps {
  buckets?: InventoryBuckets;
  ownedItemHashes: Set<number>;
  presentationNodeHash?: number;
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
  trackerService?: DestinyTrackerService;
  stores?: DimStore[];
}

/**
 * The collections screen that shows items you can get back from the vault, like emblems and exotics.
 */
class Collections extends React.Component<Props, State> {
  private $scope = $rootScope.$new(true);

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
    const { buckets, ownedItemHashes, presentationNodeHash } = this.props;
    const { defs, profileResponse, trackerService } = this.state;

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

    // TODO: how to search and find an item within all nodes?
    let nodePath: number[] = [];
    if (presentationNodeHash) {
      let currentHash = presentationNodeHash;
      nodePath = [currentHash];
      let node = defs.PresentationNode.get(currentHash);
      while (node.parentNodeHashes.length) {
        nodePath.unshift(node.parentNodeHashes[0]);
        currentHash = node.parentNodeHashes[0];
        node = defs.PresentationNode.get(currentHash);
      }
    }
    nodePath.unshift(3790247699);

    console.log(nodePath);

    return (
      <div className="vendor d2-vendors dim-page">
        <ErrorBoundary name="Ornaments">
          <Ornaments defs={defs} profileResponse={profileResponse} />
        </ErrorBoundary>
        <ErrorBoundary name="Catalysts">
          <Catalysts defs={defs} profileResponse={profileResponse} />
        </ErrorBoundary>
        <ErrorBoundary name="Collections">
          <PresentationNode
            presentationNodeHash={3790247699}
            defs={defs}
            profileResponse={profileResponse}
            buckets={buckets}
            ownedItemHashes={ownedItemHashes}
            path={nodePath}
          />
        </ErrorBoundary>
        <ErrorBoundary name="PlugSets">
          {Array.from(plugSetHashes).map((plugSetHash) => (
            <PlugSet
              key={plugSetHash}
              defs={defs}
              plugSetHash={Number(plugSetHash)}
              items={itemsForPlugSet(profileResponse, Number(plugSetHash))}
              trackerService={trackerService}
            />
          ))}
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

function itemsForPlugSet(profileResponse: DestinyProfileResponse, plugSetHash: number) {
  return profileResponse.profilePlugSets.data.plugs[plugSetHash].concat(
    _.flatten(
      Object.values(profileResponse.characterPlugSets.data).map((d) => d.plugs[plugSetHash])
    )
  );
}

export default connect<StoreProps>(mapStateToProps)(Collections);
