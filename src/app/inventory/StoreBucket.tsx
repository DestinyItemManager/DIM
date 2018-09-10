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

interface Props {
  items: DimItem[];
  settings: Readonly<Settings>;

  // TODO: probably don't need all of this
  bucket: InventoryBucket;
  store: DimStore;
  newItems: Set<string>;
  itemInfos: InventoryState['itemInfos'];

  // TODO: pass drag/drop stuff all the way up?
}

/**
 * A single bucket of items (for a single store).
 */
export default class StoreBucket extends React.Component<Props> {
  render() {
    const { items, newItems, itemInfos, settings, bucket, store } = this.props;

    const empty = !items.length;
    const equippedItem = items.find((i) => i.equipped);
    const unequippedItems = sortItems(
      items.filter((i) => !i.equipped),
      settings.itemSortOrder()
    );

    return (
      <div className={classNames('sub-section', { empty })}>
        {equippedItem && (
          <StoreBucketDropTarget
            equip={true}
            bucket={bucket}
            store={store}
          >
            <StoreInventoryItem item={equippedItem} isNew={newItems.has(equippedItem.id)} tag={getTag(equippedItem, itemInfos)} />
          </StoreBucketDropTarget>
        )}
        <StoreBucketDropTarget
          equip={false}
          bucket={bucket}
          store={store}
        >
          {unequippedItems.map((item) => (
            <StoreInventoryItem key={item.index} item={item} isNew={newItems.has(item.id)} tag={getTag(item, itemInfos)}/>
          ))}
        </StoreBucketDropTarget>
      </div>
    );
  }
}

function getTag(item: DimItem, itemInfos: InventoryState['itemInfos']): string | undefined {
  const itemKey = `${item.hash}-${item.id}`;
  return itemInfos[itemKey] && itemInfos[itemKey].tag;
}
