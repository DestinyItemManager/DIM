import React from 'react';
import { PerkCombination, ArmorTypes, LockedPerkHash } from './types';
import clsx from 'clsx';
import ClickOutside from '../../dim-ui/ClickOutside';
import BungieImage from '../../dim-ui/BungieImage';
import { D1GridNode } from '../../inventory/item-types';

interface Props {
  activePerks: PerkCombination;
  lockedPerks: { [armorType in ArmorTypes]: LockedPerkHash };
  type: ArmorTypes;
  onPerkLocked(perk: D1GridNode, type: ArmorTypes, $event: React.MouseEvent): void;
  onClose(): void;
}

interface State {
  shiftHeld: boolean;
}

export default class LoadoutBuilderLocksDialog extends React.Component<Props, State> {
  state: State = { shiftHeld: false };

  componentDidMount() {
    document.addEventListener('keydown', this.keydown);
    document.addEventListener('keyup', this.keyup);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keydown);
    document.removeEventListener('keyup', this.keyup);
  }

  render() {
    const { onClose, lockedPerks, type, activePerks, onPerkLocked } = this.props;
    const { shiftHeld } = this.state;

    return (
      <ClickOutside className="perk-select-popup" onClickOutside={onClose}>
        <div className={clsx('perk-select-box', '', { 'shift-held': shiftHeld })}>
          {activePerks[type].map((perk) => (
            <div
              key={perk.hash}
              className={clsx(
                'perk',
                lockedPerks[type][perk.hash]
                  ? `active-perk-${lockedPerks[type][perk.hash].lockType}`
                  : undefined
              )}
              onClick={(e) => onPerkLocked(perk, type, e)}
            >
              <BungieImage src={perk.icon} title={perk.description} />
              <small>{perk.name}</small>
            </div>
          ))}
        </div>
      </ClickOutside>
    );
  }

  keydown = (e: KeyboardEvent) => {
    if (!this.state.shiftHeld && e.shiftKey) {
      this.setState({ shiftHeld: e.shiftKey });
    }
  };

  keyup = (e: KeyboardEvent) => {
    if (this.state.shiftHeld) {
      this.setState({ shiftHeld: e.shiftKey });
    }
  };
}
