import { UIViewInjectedProps } from '@uirouter/react';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { D2Item } from '../../inventory/item-types';
import { LockedItemType } from '../types';
import LoadoutBucketDropTarget from './LoadoutBucketDropTarget';
import './lockedarmor.scss';
import LockedItem from './LockedItem';
import LockablePopup from './popup/LockablePopup';
import { toggleLockedItem } from '../generated-sets/utils';

interface Props {
  bucket: InventoryBucket;
  items: { [itemHash: number]: D2Item[] };
  perks: Set<DestinyInventoryItemDefinition>;
  locked?: LockedItemType[];
  onLockChanged(bucket: InventoryBucket, locked?: LockedItemType[]): void;
}

interface State {
  isOpen: boolean;
}

export default class LockedArmor extends React.Component<Props & UIViewInjectedProps, State> {
  state: State = {
    isOpen: false
  };

  openPerkSelect = () => {
    this.setState({ isOpen: true });
  };

  closePerkSelect = () => {
    this.setState({ isOpen: false });
  };

  setLockedItem = (item: D2Item) => {
    this.props.onLockChanged(this.props.bucket, [
      {
        type: 'item',
        item
      }
    ]);
  };

  toggleLockedItem = (lockedItem: LockedItemType) => {
    toggleLockedItem(lockedItem, this.props.bucket, this.props.onLockChanged, this.props.locked);
  };

  reset = () => {
    this.props.onLockChanged(this.props.bucket);
  };

  render() {
    const { items, perks, locked, bucket, onLockChanged } = this.props;
    const { isOpen } = this.state;

    return (
      <div className="locked-item">
        <LoadoutBucketDropTarget bucketType={bucket.type!} onItemLocked={this.setLockedItem}>
          {locked && locked.length !== 0 && <div className="close" onClick={this.reset} />}
          <LockedItem
            locked={locked}
            bucket={bucket}
            toggleOpen={this.openPerkSelect}
            onExclude={this.toggleLockedItem}
          />
        </LoadoutBucketDropTarget>
        <LockablePopup
          bucket={bucket}
          items={items}
          perks={perks}
          locked={locked}
          isOpen={isOpen}
          onLockChanged={onLockChanged}
          onClose={this.closePerkSelect}
        />
      </div>
    );
  }
}
