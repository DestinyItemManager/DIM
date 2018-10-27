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
import { toggleLockedItem } from '../../generated-sets/utils';

interface Props {
  bucket: InventoryBucket;
  items: { [itemHash: number]: D2Item[] };
  perks: Set<DestinyInventoryItemDefinition>;
  filteredPerks: Set<DestinyInventoryItemDefinition>;
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
    tabSelected: 'perks',
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

  toggleLockedItem = (lockedItem: LockedItemType) => {
    toggleLockedItem(lockedItem, this.props.bucket, this.props.onLockChanged, this.props.locked);
  };

  render() {
    const { isOpen, locked, items, perks, filteredPerks } = this.props;
    const { tabSelected, hoveredPerk } = this.state;

    if (!isOpen) {
      return null;
    }

    return (
      <ClickOutside onClickOutside={this.closePerkSelect} className="add-perk-options">
        <div className="add-perk-options-title move-popup-tabs">
          <span
            className={classNames('move-popup-tab', { selected: tabSelected === 'perks' })}
            data-tab="perks"
            onClick={this.setTab}
          >
            {t('LoadoutBuilder.LockPerksTabTitle')}
          </span>
          <span
            className={classNames('move-popup-tab', { selected: tabSelected === 'items' })}
            data-tab="items"
            onClick={this.setTab}
          >
            {t('LoadoutBuilder.LockItemTabTitle')}
          </span>
          <div className="close" onClick={this.closePerkSelect} />
        </div>

        {tabSelected === 'items' && (
          <LockableItems items={items} locked={locked} toggleExcludeItem={this.toggleLockedItem} />
        )}
        {tabSelected === 'perks' && (
          <LockablePerks
            perks={perks}
            filteredPerks={filteredPerks}
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
