import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { t } from 'app/i18next-t';
import React, { useState } from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import { D1GridNode, DimItem } from '../../inventory/item-types';
import { AppIcon, plusIcon } from '../../shell/icons';
import LoadoutBucketDropTarget from './LoadoutBuilderDropTarget';
import LoadoutBuilderItem from './LoadoutBuilderItem';
import * as styles from './LoadoutBuilderLockPerk.m.scss';
import LoadoutBuilderLocksDialog from './LoadoutBuilderLocksDialog';
import { ArmorTypes, D1ItemWithNormalStats, LockedPerkHash, PerkCombination } from './types';

export default function LoadoutBuilderLockPerk({
  type,
  lockeditem,
  i18nItemNames,
  activePerks,
  lockedPerks,
  onRemove,
  onPerkLocked,
  onItemLocked,
}: {
  type: ArmorTypes;
  lockeditem: D1ItemWithNormalStats | null;
  lockedPerks: { [armorType in ArmorTypes]: LockedPerkHash };
  activePerks: PerkCombination;
  i18nItemNames: { [key in ArmorTypes]: string };
  onRemove: ({ type }: { type: ArmorTypes }) => void;
  onPerkLocked: (perk: D1GridNode, type: ArmorTypes, $event: React.MouseEvent) => void;
  onItemLocked: (item: DimItem) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const closeDialog = () => setDialogOpen(false);
  const addPerkClicked = () => setDialogOpen(true);

  const doOnPerkLocked = (perk: D1GridNode, type: ArmorTypes, $event: React.MouseEvent) => {
    closeDialog();
    onPerkLocked(perk, type, $event);
  };

  const firstPerk = lockedPerks[type][parseInt(Object.keys(lockedPerks[type])[0], 10)];
  const hasLockedPerks = Object.keys(lockedPerks[type]).length > 0;

  return (
    <LoadoutBucketDropTarget
      className={styles.lockedItem}
      bucketHash={type}
      onItemLocked={onItemLocked}
    >
      {lockeditem ? (
        <ClosableContainer onClose={() => onRemove({ type })}>
          <LoadoutBuilderItem item={lockeditem} />
        </ClosableContainer>
      ) : (
        <div className={styles.emptyItem} onClick={addPerkClicked}>
          {hasLockedPerks ? (
            <BungieImage src={firstPerk.icon} title={firstPerk.description} />
          ) : (
            <div className={styles.lockPerkIcon}>
              <AppIcon icon={plusIcon} />
              <small>{t('LB.LockPerk')}</small>
            </div>
          )}
        </div>
      )}
      <div>{i18nItemNames[type]}</div>
      {dialogOpen && (
        <LoadoutBuilderLocksDialog
          activePerks={activePerks}
          lockedPerks={lockedPerks}
          type={type}
          onPerkLocked={doOnPerkLocked}
          onClose={closeDialog}
        />
      )}
    </LoadoutBucketDropTarget>
  );
}
