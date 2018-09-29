import './loadoutbuilder.scss';
import * as React from 'react';
import * as classNames from 'classnames';
import { UIViewInjectedProps } from '@uirouter/react';
import BungieImage from '../dim-ui/BungieImage';
import ClickOutside from '../dim-ui/ClickOutside';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { InventoryBucket } from '../inventory/inventory-buckets';
import LoadoutBucketDropTarget from './LoadoutBucketDropTarget';
import { DimItem } from '../inventory/item-types';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import InventoryItem from '../inventory/InventoryItem';

interface Props {
  defs: D2ManifestDefinitions;
  bucket: InventoryBucket;
  perks: Set<number>;
  locked: DimItem[];
  onLockChanged(bucket: InventoryBucket, locked: DimItem[]): void;
}

interface State {
  isOpen: boolean;
  hoveredPerk: string;
}

const defaultPerkTitle = 'Select perks to lock';

export default class LockedArmor extends React.Component<Props & UIViewInjectedProps, State> {
  state: State = {
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

  render() {
    const { defs, perks, locked, bucket } = this.props;
    const { isOpen, hoveredPerk } = this.state;
    if (!defs) {
      return null;
    }
    const itemDef = defs.InventoryItem;

    return (
      <div className="locked-item">
        <LoadoutBucketDropTarget bucketType={bucket.type!} onItemLocked={this.setLockedItem}>
          {locked.length !== 0 && <div className="close" onClick={this.reset} />}
          <LockedItem {...{ locked, toggleOpen: this.openPerkSelect, reset: this.reset }} />
        </LoadoutBucketDropTarget>
        <div className="add-perk-label">{bucket.name}</div>

        {isOpen && (
          <ClickOutside onClickOutside={this.closePerkSelect} className="add-perk-options">
            <div className="add-perk-options-title">
              <div>{hoveredPerk}</div>
              {locked.length !== 0 && (
                <button className="clear" onClick={this.reset}>
                  Reset
                </button>
              )}
              <div className="close" onClick={this.closePerkSelect} />
            </div>
            <div className="add-perk-options-content" onMouseLeave={this.resetHover}>
              {perks &&
                [...perks].map((perk) => (
                  <SelectableBungieImage
                    key={perk}
                    selected={locked.find((p) => p.hash === perk)}
                    perk={itemDef[perk]}
                    onLockedPerk={this.toggleLockedPerk}
                    onHoveredPerk={this.setHoveredPerk}
                  />
                ))}
            </div>
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
        <div className="add-perk-text">Lock Perk</div>
      </div>
    </div>
  );
};
