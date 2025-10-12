import { useShiftHeld } from 'app/utils/hooks';
import clsx from 'clsx';
import React from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import ClickOutside from '../../dim-ui/ClickOutside';
import { D1GridNode } from '../../inventory/item-types';
import * as styles from './LoadoutBuilderLocksDialog.m.scss';
import { ArmorTypes, LockedPerkHash, PerkCombination } from './types';

interface Props {
  activePerks: PerkCombination;
  lockedPerks: { [armorType in ArmorTypes]: LockedPerkHash };
  type: ArmorTypes;
  onPerkLocked: (perk: D1GridNode, type: ArmorTypes, $event: React.MouseEvent) => void;
  onClose: () => void;
}

export default function LoadoutBuilderLocksDialog({
  onClose,
  lockedPerks,
  type,
  activePerks,
  onPerkLocked,
}: Props) {
  const shiftHeld = useShiftHeld();

  return (
    <ClickOutside className={styles.perkSelectPopup} onClickOutside={onClose}>
      <div className={clsx(styles.perkSelectBox, { [styles.shiftHeld]: shiftHeld })}>
        {activePerks[type].map((perk) => (
          <div
            key={perk.hash}
            className={clsx(
              styles.perk,
              lockedPerks[type][perk.hash]
                ? lockedPerks[type][perk.hash].lockType === 'and'
                  ? styles.and
                  : styles.or
                : undefined,
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
