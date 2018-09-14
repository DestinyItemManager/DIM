import * as React from 'react';
import { DimStore, DimVault } from './store-types';
import { sortStores } from '../shell/dimAngularFilters.filter';
import { Settings, itemTags } from '../settings/settings';
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
import { InventoryState } from './reducer';
import { ReviewsState } from '../item-review/reducer';
import { DimItem } from './item-types';
import { createSelector } from 'reselect';
import { buildSearchConfig, searchFilters } from '../search/search-filters';
import { D1Categories } from '../destiny1/d1-buckets.service';
import { D2Categories } from '../destiny2/d2-buckets.service';
import { D1StoresService } from './d1-stores.service';
import { D2StoresService } from './d2-stores.service';
import Hammer from 'react-hammerjs';

interface Props {
  stores: DimStore[];
  isPhonePortrait: boolean;
  // TODO: bind just the settings we care about
  settings: Settings;
  buckets: InventoryBuckets;
  newItems: Set<string>;
  itemInfos: InventoryState['itemInfos'];
  ratings: ReviewsState['ratings'];
  collapsedSections: Settings['collapsedSections'];
  searchFilter(item: DimItem): boolean;
}

interface State {
  selectedStoreId?: string;
}

const EMPTY_SET = new Set<string>();

// TODO: move selectors elsewhere?
const querySelector = (state: RootState) => state.shell.searchQuery;
const destinyVersionSelector = (state: RootState) =>
  (state.accounts.currentAccount &&
    state.accounts.accounts[state.accounts.currentAccount].destinyVersion) ||
  2;

/**
 * A selector for the search config for a particular destiny version.
 */
const searchConfigSelector = createSelector(destinyVersionSelector, (destinyVersion) => {
  // From search filter component
  const searchConfig = buildSearchConfig(
    destinyVersion,
    itemTags,
    destinyVersion === 1 ? D1Categories : D2Categories
  );
  return searchFilters(searchConfig, destinyVersion === 1 ? D1StoresService : D2StoresService);
});

/**
 * A selector for a predicate function for searching items, given the current search query.
 */
// TODO: this also needs to depend on:
// * settings
// * loadouts
// * current character
// * all items (for dupes)
// * itemInfo
// * ratings
// * newItems
// * and maybe some other stuff?
const searchFilterSelector = createSelector(querySelector, searchConfigSelector, (query, filters) =>
  filters.filterFunction(query)
);

const storesSelector = (state: RootState) => state.inventory.stores;
const characterOrderSelector = (state: RootState) =>
  (state.settings.settings as Settings).characterOrder;
const sortedStoresSelector = createSelector(storesSelector, characterOrderSelector, sortStores);

function mapStateToProps(state: RootState): Partial<Props> {
  const settings = state.settings.settings as Settings;
  return {
    stores: sortedStoresSelector(state),
    buckets: state.inventory.buckets,
    // If "show new items" is off, don't pay the cost of propagating new item updates
    newItems: settings.showNewItems ? state.inventory.newItems : EMPTY_SET,
    itemInfos: state.inventory.itemInfos,
    ratings: state.reviews.ratings,
    isPhonePortrait: state.shell.isPhonePortrait,
    settings,
    // Pulling this out lets us do ref-equality
    collapsedSections: settings.collapsedSections,
    searchFilter: searchFilterSelector(state)
  };
}

/**
 * Display inventory and character headers for all characters and the vault.
 */
class Stores extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { stores, isPhonePortrait } = this.props;
    const { selectedStoreId } = this.state;

    if (!stores.length) {
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
        <div className="inventory-content phone-portrait react">
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
                        internalLoadoutMenu={false}
                        store={store}
                        selectedStore={selectedStore}
                        onTapped={this.selectStore}
                      />
                    </View>
                  ))}
                </Track>
              </Frame>
            </ViewPager>
          </ScrollClassDiv>

          <div className="detached" loadout-id={selectedStore.id} />

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
              <StoreHeading internalLoadoutMenu={true} store={store} />
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

  private renderStores(stores: DimStore[], vault: DimVault, currentStore: DimStore) {
    const {
      settings,
      buckets,
      newItems,
      itemInfos,
      ratings,
      searchFilter,
      collapsedSections
    } = this.props;

    return (
      <div>
        {Object.keys(buckets.byCategory).map(
          (category) =>
            categoryHasItems(buckets, category, stores) && (
              <div key={category} className="section">
                <CollapsibleTitle
                  title={t(`Bucket.${category}`)}
                  sectionId={category}
                  collapsedSections={collapsedSections}
                >
                  {stores[0].isDestiny1() &&
                    buckets.byCategory[category][0].vaultBucket && (
                      <span className="bucket-count">
                        {vault.vaultCounts[buckets.byCategory[category][0].vaultBucket!.id].count}/
                        {buckets.byCategory[category][0].vaultBucket!.capacity}
                      </span>
                    )}
                </CollapsibleTitle>
                {!collapsedSections[category] &&
                  buckets.byCategory[category].map((bucket) => (
                    <StoreBuckets
                      key={bucket.id}
                      bucket={bucket}
                      stores={stores}
                      vault={vault}
                      currentStore={currentStore}
                      settings={settings}
                      newItems={newItems}
                      itemInfos={itemInfos}
                      ratings={ratings}
                      searchFilter={searchFilter}
                    />
                  ))}
              </div>
            )
        )}
        {stores[0].isDestiny1() && (
          <D1ReputationSection stores={stores} collapsedSections={collapsedSections} />
        )}
      </div>
    );
  }
}

/** Is there any store that has an item in any of the buckets in this category? */
function categoryHasItems(
  buckets: InventoryBuckets,
  category: string,
  stores: DimStore[]
): boolean {
  const bucketIds = buckets.byCategory[category].map((b) => b.id);
  return stores.some((s) => bucketIds.some((bucketId) => s.buckets[bucketId].length > 0));
}

export default connect(mapStateToProps)(Stores);
