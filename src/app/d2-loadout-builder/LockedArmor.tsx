import { UIViewInjectedProps } from '@uirouter/react';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import * as classNames from 'classnames';
import * as React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import ClickOutside from '../dim-ui/ClickOutside';
import { InventoryBucket } from '../inventory/inventory-buckets';
import InventoryItem from '../inventory/InventoryItem';
import { D2Item } from '../inventory/item-types';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import StoreInventoryItem from '../inventory/StoreInventoryItem';
import LoadoutBucketDropTarget from './LoadoutBucketDropTarget';
import { LockType } from './LoadoutBuilder';
import './loadoutbuilder.scss';

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

  toggleLockedPerk = (lockedPerk: D2Item) => {
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

const LockableItems = (props) => {
  const onExclude = (item) => {
    props.onLockChanged(this.props.bucket, {
      type: 'exclude',
      items: [item]
    });
  };

  return (
    <>
      <div>Drag item to lock (Shift-click to exclude)</div>
      <div className="add-perk-options-content">
        {Object.values(props.items).map((instances: D2Item[]) =>
          instances.map((item) => (
            <ExcludableItem key={item.id} item={item} locked={props.locked} onExclude={onExclude} />
          ))
        )}
      </div>
    </>
  );
};

const LockablePerks = (props) => {
  const isLocked = props.locked && props.locked.items && props.locked.items.length !== 0;

  const resetHover = () => {
    props.onPerkHover();
  };
  const setHoveredPerk = (hoveredPerk) => {
    props.onPerkHover(hoveredPerk);
  };

  return (
    <>
      {isLocked && (
        <button className="clear" onClick={props.reset}>
          Reset
        </button>
      )}

      <div>Select perks to lock</div>
      <div className="add-perk-options-content" onMouseLeave={resetHover}>
        {props.perks &&
          props.perks.map((perk) => (
            <SelectableBungieImage
              key={perk.hash}
              selected={isLocked && props.locked.items.find((p) => p.hash === perk.hash)}
              perk={perk}
              onLockedPerk={props.toggleLockedPerk}
              onHoveredPerk={setHoveredPerk}
            />
          ))}
      </div>

      {props.hoveredPerk && (
        <div className="add-perk-options-details">
          <h3>{props.hoveredPerk.name}</h3>
          <div>{props.hoveredPerk.description}</div>
        </div>
      )}
    </>
  );
};

const ExcludableItem = (props) => {
  // const handleShiftClick = (event) => {
  //   if (event.shiftKey) {
  //     props.onLockChanged(this.props.bucket, {
  //       type: 'exclude',
  //       items: []
  //     });
  //     event.preventDefault();
  //   }
  // };

  return (
    <div
      className={classNames({
        selected:
          props.locked &&
          props.locked.items &&
          props.locked.items.find((p) => p.index === props.item.index)
      })}
      // onClick={handleShiftClick}
    >
      <StoreInventoryItem
        item={props.item}
        isNew={false}
        // tag={getTag(item, itemInfos)}
        // rating={dtrRating ? dtrRating.overallScore : undefined}
        // hideRating={!showRating}
        searchHidden={false}
      />
    </div>
  );
};

const SelectableBungieImage = (props) => {
  const handleClick = () => {
    props.onLockedPerk(props.perk);
  };
  const handleHover = () => {
    props.onHoveredPerk(props.perk.displayProperties);
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
  // Nothing locked
  if (!props.locked) {
    return (
      <div className="empty-item" onClick={props.toggleOpen}>
        <div className="add-perk-container">
          <div className="add-perk-text">Lock {props.bucket.name}</div>
        </div>
      </div>
    );
  }

  // Multi-things locked
  if (props.locked.items.length > 1) {
    return (
      <div className="empty-item" onClick={props.toggleOpen}>
        <div
          className={classNames('add-perk-container', {
            'has-locked': props.locked.items.length
          })}
        >
          <div className="add-perk-text">
            {props.locked.items.length}{' '}
            {props.locked.type === 'exclude' ? 'excluded' : 'locked perks'}
          </div>
        </div>
      </div>
    );
  }

  const item = props.locked.items[0];

  // one item locked/excluded
  if (props.locked.type === 'exclude' || props.locked.type === 'item') {
    return (
      <ItemPopupTrigger item={item}>
        <InventoryItem item={item} />
      </ItemPopupTrigger>
    );
  }

  // one perk locked
  if (props.locked.type === 'perk') {
    return (
      <div onClick={props.toggleOpen}>
        <BungieImage
          key={item.hash}
          className="empty-item"
          title={item.displayProperties.name}
          src={item.displayProperties.icon}
        />
      </div>
    );
  }

  return null;
};
