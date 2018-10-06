import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import * as classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import ClickOutside from '../../../dim-ui/ClickOutside';
import { InventoryBucket } from '../../../inventory/inventory-buckets';
import { D2Item } from '../../../inventory/item-types';
import { LockType } from '../../types';
import LockableItems from './LockableItemsTab';
import LockablePerks from './LockablePerksTab';

interface Props {
  bucket: InventoryBucket;
  items: { [itemHash: number]: D2Item[] };
  perks: DestinyInventoryItemDefinition[];
  isOpen: boolean;
  locked?: LockType;
  onClose(): void;
  onLockChanged(bucket: InventoryBucket, locked?: LockType): void;
}

interface State {
  tabSelected: 'items' | 'perks';
  isOpen: boolean;
  hoveredPerk?: { name: string; description: string };
}

export default class LockablePopup extends React.Component<Props, State> {
  state: State = {
    tabSelected: 'items',
    isOpen: false
  };

  onPerkHover = (hoveredPerk) => {
    this.setState({ hoveredPerk });
  };

  setTab = (event) => {
    this.setState({ tabSelected: event.target.dataset.tab });
  };

  closePerkSelect = () => {
    this.props.onClose();
  };

  reset = () => {
    this.props.onLockChanged(this.props.bucket);
  };

  toggleExcludeItem = (excludedItem: D2Item) => {
    let newExcludes = new Set();
    if (this.props.locked && this.props.locked.type === 'exclude') {
      newExcludes = new Set(this.props.locked.items);
    }
    if (newExcludes.has(excludedItem)) {
      newExcludes.delete(excludedItem);
    } else {
      newExcludes.add(excludedItem);
    }

    if (newExcludes.size === 0) {
      return this.props.onLockChanged(this.props.bucket);
    }

    this.props.onLockChanged(this.props.bucket, {
      type: 'exclude',
      items: Array.from(newExcludes)
    });
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

  render() {
    const { isOpen, locked, items, perks } = this.props;
    const { tabSelected, hoveredPerk } = this.state;

    if (!isOpen) {
      return null;
    }

    return (
      <ClickOutside onClickOutside={this.closePerkSelect} className="add-perk-options">
        <div className="add-perk-options-title move-popup-tabs">
          <span
            className={classNames('move-popup-tab', { selected: tabSelected === 'items' })}
            data-tab="items"
            onClick={this.setTab}
          >
            {t('LoadoutBuilder.LockItemTabTitle')}
          </span>
          <span
            className={classNames('move-popup-tab', { selected: tabSelected === 'perks' })}
            data-tab="perks"
            onClick={this.setTab}
          >
            {t('LoadoutBuilder.LockPerksTabTitle')}
          </span>
          <div className="close" onClick={this.closePerkSelect} />
          {locked &&
            locked.items &&
            locked.items.length !== 0 && (
              <button className="clear" onClick={this.reset}>
                {t('LoadoutBuilder.ResetPerks')}
              </button>
            )}
        </div>

        {tabSelected === 'items' && (
          <LockableItems {...{ items, locked, toggleExcludeItem: this.toggleExcludeItem }} />
        )}
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
    );
  }
}
