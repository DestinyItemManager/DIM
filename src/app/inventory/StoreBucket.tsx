import * as React from 'react';
import { DimItem } from './item-types';
import classNames from 'classnames';
import { sortItems } from '../shell/dimAngularFilters.filter';
import './StoreBucket.scss';
import StoreBucketDropTarget from './StoreBucketDropTarget';
import { InventoryBucket } from './inventory-buckets';
import { DimStore } from './store-types';
import StoreInventoryItem from './StoreInventoryItem';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import { itemSortOrderSelector } from '../settings/item-sort';
import emptyEngram from '../../../destiny-icons/general/empty-engram.svg';
import * as _ from 'lodash';
import { sortedStoresSelector } from './reducer';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { globeIcon, hunterIcon, warlockIcon, titanIcon, AppIcon } from '../shell/icons';
import { showItemPicker } from '../item-picker/item-picker';
import { moveItemTo } from './dimItemMoveService.factory';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { t } from 'i18next';

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
  allStores: DimStore[];
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  const { storeId, bucketId } = props;
  const store = state.inventory.stores.find((s) => s.id === storeId)!;

  return {
    items: store.buckets[bucketId],
    bucket: state.inventory.buckets!.byId[props.bucketId],
    store,
    itemSortOrder: itemSortOrderSelector(state),
    allStores: sortedStoresSelector(state)
  };
}

type Props = ProvidedProps & StoreProps;

const classIcons = {
  [DestinyClass.Unknown]: globeIcon,
  [DestinyClass.Hunter]: hunterIcon,
  [DestinyClass.Warlock]: warlockIcon,
  [DestinyClass.Titan]: titanIcon
};

/**
 * A single bucket of items (for a single store).
 */
class StoreBucket extends React.Component<Props> {
  render() {
    const { items, itemSortOrder, bucket, store, allStores } = this.props;

    // The vault divides armor by class
    if (store.isVault && bucket.inArmor) {
      const itemsByClass = _.groupBy(items, (item) => item.classType);
      const classTypeOrder = _.sortBy(Object.keys(itemsByClass), (classType) => {
        const classTypeNum = parseInt(classType, 10);
        const index = allStores.findIndex((s) => s.classType === classTypeNum);
        return index === -1 ? 999 : index;
      });

      return (
        <div className={classNames('sub-section', `bucket-${bucket.id}`)}>
          <StoreBucketDropTarget equip={false} bucket={bucket} store={store}>
            {classTypeOrder.map((classType) => (
              <React.Fragment key={classType}>
                <AppIcon icon={classIcons[classType]} className="armor-class-icon" />
                {sortItems(itemsByClass[classType]).map((item) => (
                  <StoreInventoryItem key={item.index} item={item} />
                ))}
              </React.Fragment>
            ))}
          </StoreBucketDropTarget>
        </div>
      );
    }

    const equippedItem = items.find((i) => i.equipped);
    const unequippedItems = sortItems(items.filter((i) => !i.equipped), itemSortOrder);

    return (
      <div
        className={classNames('sub-section', `bucket-${bucket.id}`, {
          'not-equippable': !store.isVault && !equippedItem
        })}
      >
        {equippedItem && (
          <StoreBucketDropTarget equip={true} bucket={bucket} store={store}>
            <div className="equipped-item">
              <StoreInventoryItem key={equippedItem.index} item={equippedItem} />
            </div>
            {bucket.hasTransferDestination && (
              <a onClick={this.pickEquipItem} className="pull-item-button">
                <AppIcon icon={faPlusCircle} />
              </a>
            )}
          </StoreBucketDropTarget>
        )}
        <StoreBucketDropTarget equip={false} bucket={bucket} store={store}>
          {unequippedItems.map((item) => (
            <StoreInventoryItem key={item.index} item={item} equippedItem={equippedItem} />
          ))}
          {bucket.id === '375726501' &&
            _.times(bucket.capacity - unequippedItems.length, (index) => (
              <img src={emptyEngram} className="empty-engram" key={index} />
            ))}
        </StoreBucketDropTarget>
      </div>
    );
  }

  private pickEquipItem = async () => {
    const { bucket, store } = this.props;

    try {
      const { item, equip } = await showItemPicker({
        filterItems: (item: DimItem) => item.bucket.id === bucket.id && item.canBeEquippedBy(store),
        prompt: t('MovePopup.PullItem', {
          bucket: bucket.name,
          store: store.name
        })
      });

      moveItemTo(item, store, equip, item.amount);
      // tslint:disable-next-line:no-empty
    } catch (e) {}
  };
}

export default connect<StoreProps>(mapStateToProps)(StoreBucket);
