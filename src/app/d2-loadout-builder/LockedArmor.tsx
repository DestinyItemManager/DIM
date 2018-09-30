import './loadoutbuilder.scss';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as classNames from 'classnames';
import { UIViewInjectedProps } from '@uirouter/react';
import BungieImage from '../dim-ui/BungieImage';
import ClickOutside from '../dim-ui/ClickOutside';
import { InventoryBucket } from '../inventory/inventory-buckets';
import LoadoutBucketDropTarget from './LoadoutBucketDropTarget';
import { DimItem, D2Item } from '../inventory/item-types';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import InventoryItem from '../inventory/InventoryItem';
import StoreInventoryItem from '../inventory/StoreInventoryItem';

interface Props {
  bucket: InventoryBucket;
  items: { [itemHash: number]: D2Item[] };
  perks: DestinyInventoryItemDefinition[];
  locked: DimItem[];
  onLockChanged(bucket: InventoryBucket, locked: DimItem[]): void;
}

interface State {
  tabSelected: string;
  isOpen: boolean;
  hoveredPerk: string;
}

const defaultPerkTitle = 'Select perks to lock';

export default class LockedArmor extends React.Component<Props & UIViewInjectedProps, State> {
  state: State = {
    tabSelected: 'items',
    isOpen: false,
    hoveredPerk: defaultPerkTitle
  };

  openPerkSelect = () => {
    this.setState({ isOpen: true });
  };

  closePerkSelect = () => {
    this.setState({ isOpen: false });
  };

  reset = () => {
    this.props.onLockChanged(this.props.bucket, []);
  };

  setLockedItem = (lockedItem: DimItem) => {
    this.props.onLockChanged(this.props.bucket, [lockedItem]);
  };

  toggleLockedPerk = (lockedPerk: DimItem) => {
    const newPerks = new Set(this.props.locked);
    if (newPerks.has(lockedPerk)) {
      newPerks.delete(lockedPerk);
    } else {
      newPerks.add(lockedPerk);
    }

    const locked = Array.from(newPerks);
    this.props.onLockChanged(this.props.bucket, locked);
  };

  resetHover = () => {
    this.setState({ hoveredPerk: defaultPerkTitle });
  };
  setHoveredPerk = (hoveredPerk: string) => {
    this.setState({ hoveredPerk });
  };
  setTab = (element) => {
    this.setState({ tabSelected: element.target.dataset.tab });
  };

  render() {
    const { items, perks, locked, bucket } = this.props;
    const { isOpen, tabSelected, hoveredPerk } = this.state;

    return (
      <div className="locked-item">
        <LoadoutBucketDropTarget bucketType={bucket.type!} onItemLocked={this.setLockedItem}>
          {locked.length !== 0 && <div className="close" onClick={this.reset} />}
          <LockedItem {...{ locked, bucket, toggleOpen: this.openPerkSelect, reset: this.reset }} />
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

            {tabSelected === 'items' && (
              <>
                <div>Drag item to lock</div>
                <div className="add-perk-options-content">
                  {Object.values(items).map((instances) =>
                    instances.map((item) => {
                      return (
                        <StoreInventoryItem
                          key={item.index}
                          item={item}
                          isNew={false}
                          // tag={getTag(item, itemInfos)}
                          // rating={dtrRating ? dtrRating.overallScore : undefined}
                          // hideRating={!showRating}
                          searchHidden={false}
                        />
                      );
                    })
                  )}
                </div>
              </>
            )}
            {tabSelected === 'perks' && (
              <>
                {locked.length !== 0 && (
                  <button className="clear" onClick={this.reset}>
                    Reset
                  </button>
                )}
                <div>{hoveredPerk}</div>
                <div className="add-perk-options-content" onMouseLeave={this.resetHover}>
                  {perks &&
                    perks.map((perk) => (
                      <SelectableBungieImage
                        key={perk.hash}
                        selected={locked.find((p) => p.hash === perk.hash)}
                        perk={perk}
                        onLockedPerk={this.toggleLockedPerk}
                        onHoveredPerk={this.setHoveredPerk}
                      />
                    ))}
                </div>
              </>
            )}
          </ClickOutside>
        )}
      </div>
    );
  }
}

const SelectableBungieImage = (props) => {
  const handleClick = () => {
    props.onLockedPerk(props.perk);
  };
  const handleHover = () => {
    props.onHoveredPerk(props.perk.displayProperties.name);
  };

  return (
    <BungieImage
      className={classNames('perk-image', {
        'locked-perk': props.selected
      })}
      title={props.perk.displayProperties.name}
      src={props.perk.displayProperties.icon}
      onClick={handleClick}
      onMouseEnter={handleHover}
    />
  );
};

const LockedItem = (props) => {
  if (props.locked && props.locked[0] && props.locked[0].equipment) {
    return (
      <ItemPopupTrigger item={props.locked[0]}>
        <InventoryItem item={props.locked[0]} />
      </ItemPopupTrigger>
    );
  }

  if (props.locked && props.locked.length) {
    if (props.locked.length > 1) {
      return (
        <div className="empty-item" onClick={props.toggleOpen}>
          <div className={classNames('add-perk-container', { 'has-locked': props.locked.length })}>
            <div className="add-perk-text">{props.locked.length} locked perks</div>
          </div>
        </div>
      );
    }
    return (
      <div onClick={props.toggleOpen}>
        {props.locked.map((lockedPerk) => (
          <BungieImage
            key={lockedPerk.hash}
            className="empty-item"
            title={lockedPerk.displayProperties.name}
            src={lockedPerk.displayProperties.icon}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="empty-item" onClick={props.toggleOpen}>
      <div className="add-perk-container">
        <div className="add-perk-text">Lock {props.bucket.name}</div>
      </div>
    </div>
  );
};
