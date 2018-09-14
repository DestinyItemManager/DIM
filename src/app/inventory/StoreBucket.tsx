import * as React from 'react';
import { DimItem } from './item-types';
import { Settings } from '../settings/settings';
import classNames from 'classnames';
import { sortItems } from '../shell/dimAngularFilters.filter';
import './dimStoreBucket.scss';
import StoreBucketDropTarget from './StoreBucketDropTarget';
import { InventoryBucket } from './inventory-buckets';
import { DimStore } from './store-types';
import StoreInventoryItem from './StoreInventoryItem';
import { InventoryState } from './reducer';
import { ReviewsState } from '../item-review/reducer';
import { TagValue } from './dim-item-info';
import { RootState } from '../store/reducers';
import { searchFilterSelector } from '../search/search-filters';
import { connect } from 'react-redux';

// Props provided from parents
interface ProvidedProps {
  storeId: string;
  bucketId: string;
}

// Props from Redux via mapStateToProps
interface StoreProps {
  // TODO: which of these will actually update purely?
  items: DimItem[];
  bucket: InventoryBucket;
  store: DimStore;
  itemSortOrder: string[];
  newItems: Set<string>;
  itemInfos: InventoryState['itemInfos'];
  ratings: ReviewsState['ratings'];
  searchFilter(item: DimItem): boolean;
}

const EMPTY_SET = new Set<string>();

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  const { storeId, bucketId } = props;
  const settings = state.settings.settings as Settings;
  const store = state.inventory.stores.find((s) => s.id === storeId)!;

  return {
    items: store.buckets[bucketId],
    bucket: state.inventory.buckets!.byId[props.bucketId],
    store,
    itemSortOrder: settings.itemSortOrder(),
    // If "show new items" is off, don't pay the cost of propagating new item updates
    newItems: settings.showNewItems ? state.inventory.newItems : EMPTY_SET,
    itemInfos: state.inventory.itemInfos,
    ratings: state.reviews.ratings,
    searchFilter: searchFilterSelector(state)
  };
}

type Props = ProvidedProps & StoreProps;

/**
 * A single bucket of items (for a single store).
 */
class StoreBucket extends React.Component<Props> {
  render() {
    const { items, itemSortOrder, bucket, store } = this.props;

    const empty = !items.length;
    const equippedItem = items.find((i) => i.equipped);
    const unequippedItems = sortItems(items.filter((i) => !i.equipped), itemSortOrder);

    return (
      <div className={classNames('sub-section', { empty })}>
        {equippedItem && (
          <StoreBucketDropTarget equip={true} bucket={bucket} store={store}>
            {this.renderItem(equippedItem)}
          </StoreBucketDropTarget>
        )}
        <StoreBucketDropTarget equip={false} bucket={bucket} store={store}>
          {unequippedItems.map((item) => this.renderItem(item))}
        </StoreBucketDropTarget>
      </div>
    );
  }

  renderItem = (item: DimItem) => {
    const { newItems, itemInfos, ratings, searchFilter } = this.props;

    return (
      <StoreInventoryItem
        key={item.index}
        item={item}
        isNew={newItems.has(item.id)}
        tag={getTag(item, itemInfos)}
        rating={getRating(item, ratings)}
        searchHidden={!searchFilter(item)}
      />
    );
  };
}

function getTag(item: DimItem, itemInfos: InventoryState['itemInfos']): TagValue | undefined {
  const itemKey = `${item.hash}-${item.id}`;
  return itemInfos[itemKey] && itemInfos[itemKey].tag;
}

function getRating(item: DimItem, ratings: ReviewsState['ratings']): number | undefined {
  const roll = item.isDestiny1() ? (item.talentGrid ? item.talentGrid.dtrRoll : null) : 'fixed'; // TODO: implement random rolls
  const itemKey = `${item.hash}-${roll}`;
  return ratings[itemKey] && ratings[itemKey].overallScore;
}

export default connect<StoreProps>(mapStateToProps)(StoreBucket);
