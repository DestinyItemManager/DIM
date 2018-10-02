import { UIViewInjectedProps } from '@uirouter/react';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import * as classNames from 'classnames';
import * as React from 'react';
import ClickOutside from '../dim-ui/ClickOutside';
import { InventoryBucket } from '../inventory/inventory-buckets';
import { D2Item } from '../inventory/item-types';
import LoadoutBucketDropTarget from './LoadoutBucketDropTarget';
import { LockType } from './LoadoutBuilder';
import './loadoutbuilder.scss';
import LockableItems from './LockableItems';
import LockablePerks from './LockablePerks';
import LockedItem from './LockedItem';

interface Props {
  bucket: InventoryBucket;
  items: { [itemHash: number]: D2Item[] };
  perks: DestinyInventoryItemDefinition[];
  locked?: LockType;
  onLockChanged(bucket: InventoryBucket, locked?: LockType): void;
}

interface State {
  tabSelected: string;
  isOpen: boolean;
  hoveredPerk?: { name: string; description: string };
}

export default class LockedArmor extends React.Component<Props & UIViewInjectedProps, State> {
  state: State = {
    tabSelected: 'items',
    isOpen: false
  };

  openPerkSelect = () => {
    this.setState({ isOpen: true });
  };

  closePerkSelect = () => {
    this.setState({ isOpen: false });
  };

  reset = () => {
    this.props.onLockChanged(this.props.bucket);
  };

  setLockedItem = (lockedItem: D2Item) => {
    this.props.onLockChanged(this.props.bucket, {
      type: 'item',
      items: [lockedItem]
    });
  };

  onPerkHover = (hoveredPerk) => {
    this.setState({ hoveredPerk });
  };

  toggleLockedPerk = (lockedPerk: DestinyInventoryItemDefinition) => {
    let newPerks = new Set();
    if (this.props.locked && this.props.locked.type === 'perk') {
      newPerks = new Set(this.props.locked.items);
    }
    if (newPerks.has(lockedPerk)) {
      newPerks.delete(lockedPerk);
    } else {
      newPerks.add(lockedPerk);
    }

    if (newPerks.size === 0) {
      return this.props.onLockChanged(this.props.bucket);
    }

    this.props.onLockChanged(this.props.bucket, {
      type: 'perk',
      items: Array.from(newPerks)
    });
  };

  setTab = (event) => {
    this.setState({ tabSelected: event.target.dataset.tab });
  };

  render() {
    const { items, perks, locked, bucket } = this.props;
    const { isOpen, tabSelected, hoveredPerk } = this.state;

    return (
      <div className="locked-item">
        <LoadoutBucketDropTarget bucketType={bucket.type!} onItemLocked={this.setLockedItem}>
          {locked &&
            locked.items &&
            locked.items.length !== 0 && <div className="close" onClick={this.reset} />}
          <LockedItem {...{ locked, bucket, toggleOpen: this.openPerkSelect }} />
        </LoadoutBucketDropTarget>

        {isOpen && (
          <ClickOutside onClickOutside={this.closePerkSelect} className="add-perk-options">
            <div className="add-perk-options-title move-popup-tabs">
              <span
                className={classNames('move-popup-tab', { selected: tabSelected === 'items' })}
                data-tab="items"
                onClick={this.setTab}
              >
                Items
              </span>
              <span
                className={classNames('move-popup-tab', { selected: tabSelected === 'perks' })}
                data-tab="perks"
                onClick={this.setTab}
              >
                Perks
              </span>
              <div className="close" onClick={this.closePerkSelect} />
            </div>

            {tabSelected === 'items' && <LockableItems {...{ items, locked }} />}
            {tabSelected === 'perks' && (
              <LockablePerks
                {...{
                  perks,
                  locked,
                  hoveredPerk,
                  onPerkHover: this.onPerkHover,
                  reset: this.reset,
                  toggleLockedPerk: this.toggleLockedPerk
                }}
              />
            )}
          </ClickOutside>
        )}
      </div>
    );
  }
}
