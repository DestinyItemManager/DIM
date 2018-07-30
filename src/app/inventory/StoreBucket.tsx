import * as React from 'react';
import { DimItem } from './item-types';
import { Settings } from '../settings/settings';
import classNames from 'classnames';
import { sortItems } from '../shell/dimAngularFilters.filter';
import './dimStoreBucket.scss';
import InventoryItem from './InventoryItem';
import StoreBucketDropTarget from './StoreBucketDropTarget';
import { InventoryBucket } from './inventory-buckets';
import { DimStore } from './store-types';
import DraggableInventoryItem from './DraggableInventoryItem';
import ItemPopupTrigger from './ItemPopupTrigger';

interface Props {
  items: DimItem[];
  settings: Readonly<Settings>;

  // TODO: probably don't need all of this
  bucket: InventoryBucket;
  store: DimStore;

  // TODO: pass drag/drop stuff all the way up?
}

/**
 * A single bucket of items (for a single store).
 */
export default class StoreBucket extends React.Component<Props> {
  render() {
    const { items, settings, bucket, store } = this.props;

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
            <DraggableInventoryItem item={equippedItem}>
              <ItemPopupTrigger item={equippedItem}>
                <InventoryItem item={equippedItem} />
              </ItemPopupTrigger>
            </DraggableInventoryItem>
          </StoreBucketDropTarget>
        )}
        <StoreBucketDropTarget
          equip={false}
          bucket={bucket}
          store={store}
        >
          {unequippedItems.map((item) => (
            <DraggableInventoryItem key={item.index} item={item}>
              <ItemPopupTrigger item={item}>
                <InventoryItem item={item} />
              </ItemPopupTrigger>
            </DraggableInventoryItem>
          ))}
        </StoreBucketDropTarget>
      </div>
    );
  }
}
