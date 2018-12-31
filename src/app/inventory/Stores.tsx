import * as React from 'react';
import { DimStore, DimVault } from './store-types';
import { InventoryBuckets } from './inventory-buckets';
import { t } from 'i18next';
import './Stores.scss';
import StoreHeading from './StoreHeading';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import { Frame, Track, View, ViewPager } from 'react-view-pager';
import ScrollClassDiv from '../dim-ui/ScrollClassDiv';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import { StoreBuckets } from './StoreBuckets';
import D1ReputationSection from './D1ReputationSection';
import Hammer from 'react-hammerjs';
import { sortedStoresSelector } from './reducer';
import { hideItemPopup } from '../item-popup/item-popup';

interface Props {
  stores: DimStore[];
  isPhonePortrait: boolean;
  buckets: InventoryBuckets;
}

interface State {
  selectedStoreId?: string;
}

function mapStateToProps(state: RootState): Props {
  return {
    stores: sortedStoresSelector(state),
    buckets: state.inventory.buckets!,
    isPhonePortrait: state.shell.isPhonePortrait
  };
}

/**
 * Display inventory and character headers for all characters and the vault.
 */
class Stores extends React.Component<Props, State> {
  private detachedLoadoutMenu = React.createRef<HTMLDivElement>();

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { stores, buckets, isPhonePortrait } = this.props;
    const { selectedStoreId } = this.state;

    if (!stores.length || !buckets) {
      return null;
    }

    const vault = stores.find((s) => s.isVault) as DimVault;
    const currentStore = stores.find((s) => s.current)!;

    const selectedStore = selectedStoreId
      ? stores.find((s) => s.id === selectedStoreId)!
      : currentStore;

    // TODO: make a component for the renderStores stuff

    if (isPhonePortrait) {
      return (
        <div className="inventory-content phone-portrait">
          <ScrollClassDiv className="store-row store-header" scrollClass="sticky">
            <ViewPager>
              <Frame className="frame" autoSize={false}>
                <Track
                  currentView={selectedStoreId === undefined ? currentStore.id : selectedStoreId}
                  contain={false}
                  onViewChange={this.onViewChange}
                  className="track"
                >
                  {stores.map((store) => (
                    <View className="store-cell" key={store.id}>
                      <StoreHeading
                        store={store}
                        selectedStore={selectedStore}
                        onTapped={this.selectStore}
                        loadoutMenuRef={this.detachedLoadoutMenu}
                      />
                    </View>
                  ))}
                </Track>
              </Frame>
            </ViewPager>
          </ScrollClassDiv>

          <div className="detached" ref={this.detachedLoadoutMenu} />

          <Hammer direction="DIRECTION_HORIZONTAL" onSwipe={this.handleSwipe}>
            {this.renderStores([selectedStore], vault, currentStore)}
          </Hammer>
        </div>
      );
    }

    return (
      <div className="inventory-content">
        <ScrollClassDiv className="store-row store-header" scrollClass="sticky">
          {stores.map((store) => (
            <div className="store-cell" key={store.id}>
              <StoreHeading store={store} />
            </div>
          ))}
        </ScrollClassDiv>
        {this.renderStores(stores, vault, currentStore)}
      </div>
    );
  }

  private onViewChange = (indices) => {
    const { stores } = this.props;
    this.setState({ selectedStoreId: stores[indices[0]].id });
    hideItemPopup();
  };

  private handleSwipe = (e) => {
    const { stores } = this.props;
    const { selectedStoreId } = this.state;

    const selectedStoreIndex = selectedStoreId
      ? stores.findIndex((s) => s.id === selectedStoreId)
      : stores.findIndex((s) => s.current);

    if (e.direction === 2 && selectedStoreIndex < stores.length - 1) {
      this.setState({ selectedStoreId: stores[selectedStoreIndex + 1].id });
    } else if (e.direction === 4 && selectedStoreIndex > 0) {
      this.setState({ selectedStoreId: stores[selectedStoreIndex - 1].id });
    }
  };

  private selectStore = (storeId: string) => {
    this.setState({ selectedStoreId: storeId });
  };

  // TODO: move RenderStores to a component
  private renderStores(stores: DimStore[], vault: DimVault, currentStore: DimStore) {
    const { buckets } = this.props;

    return (
      <div>
        {Object.keys(buckets.byCategory).map(
          (category) =>
            categoryHasItems(buckets, category, stores, currentStore) && (
              <div key={category} className="section">
                <CollapsibleTitle title={t(`Bucket.${category}`)} sectionId={category}>
                  {buckets.byCategory[category].map((bucket) => (
                    <StoreBuckets
                      key={bucket.id}
                      bucket={bucket}
                      stores={stores}
                      vault={vault}
                      currentStore={currentStore}
                    />
                  ))}
                </CollapsibleTitle>
              </div>
            )
        )}
        {stores[0].isDestiny1() && <D1ReputationSection stores={stores} />}
      </div>
    );
  }
}

/** Is there any store that has an item in any of the buckets in this category? */
function categoryHasItems(
  allBuckets: InventoryBuckets,
  category: string,
  stores: DimStore[],
  currentStore: DimStore
): boolean {
  const buckets = allBuckets.byCategory[category];
  return buckets.some((bucket) => {
    const storesToSearch = bucket.accountWide && !stores[0].isVault ? [currentStore] : stores;
    return storesToSearch.some((s) => s.buckets[bucket.id] && s.buckets[bucket.id].length > 0);
  });
}

export default connect<Props>(mapStateToProps)(Stores);
