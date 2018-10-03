import { UIViewInjectedProps } from '@uirouter/react';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { D2Item } from '../../inventory/item-types';
import { LockType } from '../types';
import LoadoutBucketDropTarget from './LoadoutBucketDropTarget';
import './lockedarmor.scss';
import LockedItem from './LockedItem';
import LockablePopup from './popup/LockablePopup';

interface Props {
  bucket: InventoryBucket;
  items: { [itemHash: number]: D2Item[] };
  perks: DestinyInventoryItemDefinition[];
  locked?: LockType;
  onLockChanged(bucket: InventoryBucket, locked?: LockType): void;
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

  setLockedItem = (lockedItem: D2Item) => {
    this.props.onLockChanged(this.props.bucket, {
      type: 'item',
      items: [lockedItem]
    });
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
          {locked &&
            locked.items &&
            locked.items.length !== 0 && <div className="close" onClick={this.reset} />}
          <LockedItem {...{ locked, bucket, toggleOpen: this.openPerkSelect }} />
        </LoadoutBucketDropTarget>
        <LockablePopup
          {...{
            bucket,
            items,
            perks,
            locked,
            isOpen,
            onLockChanged,
            onClose: this.closePerkSelect
          }}
        />
      </div>
    );
  }
}
