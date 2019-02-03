import * as React from 'react';
import * as _ from 'lodash';
import { ArmorTypes, D1ItemWithNormalStats, LockedPerkHash, PerkCombination } from './types';
import { D1GridNode } from '../inventory/item-types';
import LoadoutBuilderLockPerk from './LoadoutBuilderLockPerk';

interface Props {
  lockedItems: { [type: string]: D1ItemWithNormalStats | null };
  lockedPerks: { [armorType in ArmorTypes]: LockedPerkHash };
  activePerks: PerkCombination;
  i18nItemNames: { [key: string]: string };
  onRemove({ type }: { type: string }): void;
  onPerkLocked(perk: D1GridNode, type: ArmorTypes, $event: React.MouseEvent): void;
}

export default class LoadoutBuilderLocks extends React.Component<Props> {
  render() {
    const {
      lockedItems,
      activePerks,
      onPerkLocked,
      onRemove,
      i18nItemNames,
      lockedPerks
    } = this.props;

    // TODO: droppable

    return (
      <div className="loadout-builder-section">
        {_.map(lockedItems, (lockeditem, type: ArmorTypes) => (
          <LoadoutBuilderLockPerk
            lockeditem={lockeditem}
            activePerks={activePerks}
            lockedPerks={lockedPerks}
            type={type}
            i18nItemNames={i18nItemNames}
            onRemove={onRemove}
            onPerkLocked={onPerkLocked}
          />
        ))}
      </div>
    );
  }
}
