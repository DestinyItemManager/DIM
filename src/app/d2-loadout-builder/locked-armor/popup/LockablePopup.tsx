import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import * as classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import ClickOutside from '../../../dim-ui/ClickOutside';
import { InventoryBucket } from '../../../inventory/inventory-buckets';
import { D2Item } from '../../../inventory/item-types';
import { LockedItemType } from '../../types';
import LockableItems from './LockableItemsTab';
import LockablePerks from './LockablePerksTab';

interface Props {
  bucket: InventoryBucket;
  items: { [itemHash: number]: D2Item[] };
  perks: Set<DestinyInventoryItemDefinition>;
  isOpen: boolean;
  locked?: LockedItemType[];
  onClose(): void;
  onLockChanged(bucket: InventoryBucket, locked?: LockedItemType[]): void;
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

  toggleLockedItem = (lockedItem: LockedItemType) => {
    let newLockedItems: LockedItemType[] = [];
    if (this.props.locked && this.props.locked[0].type !== 'item') {
      newLockedItems = this.props.locked;
    }

    const existingIndex = newLockedItems.findIndex((existing) => existing.item === lockedItem.item);
    if (existingIndex > -1) {
      newLockedItems.splice(existingIndex, 1);
    } else {
      newLockedItems.push(lockedItem);
    }

    this.props.onLockChanged(
      this.props.bucket,
      newLockedItems.length === 0 ? undefined : newLockedItems
    );
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
            locked.length !== 0 && (
              <button className="clear" onClick={this.reset}>
                {t('LoadoutBuilder.ResetPerks')}
              </button>
            )}
        </div>

        {tabSelected === 'items' && (
          <LockableItems {...{ items, locked, toggleExcludeItem: this.toggleLockedItem }} />
        )}
        {tabSelected === 'perks' && (
          <LockablePerks
            perks={perks}
            locked={locked}
            hoveredPerk={hoveredPerk}
            onPerkHover={this.onPerkHover}
            toggleLockedPerk={this.toggleLockedItem}
          />
        )}
      </ClickOutside>
    );
  }
}
