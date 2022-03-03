import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { t } from 'app/i18next-t';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { BucketHashes } from 'data/d2/generated-enums';
import React, { useState } from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import { D1GridNode, DimItem } from '../../inventory/item-types';
import { AppIcon, plusIcon } from '../../shell/icons';
import LoadoutBucketDropTarget from './LoadoutBuilderDropTarget';
import LoadoutBuilderItem from './LoadoutBuilderItem';
import LoadoutBuilderLocksDialog from './LoadoutBuilderLocksDialog';
import { ArmorTypes, D1ItemWithNormalStats, LockedPerkHash, PerkCombination } from './types';

interface Props {
  type: ArmorTypes;
  lockeditem: D1ItemWithNormalStats | null;
  lockedPerks: { [armorType in ArmorTypes]: LockedPerkHash };
  activePerks: PerkCombination;
  i18nItemNames: { [key: string]: string };
  onRemove({ type }: { type: string }): void;
  onPerkLocked(perk: D1GridNode, type: ArmorTypes, $event: React.MouseEvent): void;
  onItemLocked(item: DimItem): void;
}

const typeToHash: { [key in ArmorTypes]: BucketHashes | D1BucketHashes } = {
  Helmet: BucketHashes.Helmet,
  Gauntlets: BucketHashes.Gauntlets,
  Chest: BucketHashes.ChestArmor,
  Leg: BucketHashes.LegArmor,
  ClassItem: BucketHashes.ClassArmor,
  Ghost: BucketHashes.Ghost,
  Artifact: D1BucketHashes.Artifact,
};

export default function LoadoutBuilderLockPerk({
  type,
  lockeditem,
  i18nItemNames,
  activePerks,
  lockedPerks,
  onRemove,
  onPerkLocked,
  onItemLocked,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const closeDialog = () => setDialogOpen(false);
  const addPerkClicked = () => setDialogOpen(true);

  const doOnPerkLocked = (perk: D1GridNode, type: ArmorTypes, $event: React.MouseEvent) => {
    closeDialog();
    onPerkLocked(perk, type, $event);
  };

  const firstPerk = lockedPerks[type][Object.keys(lockedPerks[type])[0]];
  const hasLockedPerks = Object.keys(lockedPerks[type]).length > 0;

  return (
    <div className="locked-item">
      <LoadoutBucketDropTarget bucketHash={typeToHash[type]} onItemLocked={onItemLocked}>
        {lockeditem === null ? (
          <div className="empty-item">
            <div className="perk-addition" onClick={addPerkClicked}>
              {hasLockedPerks ? (
                <div className="locked-perk-notification">
                  <BungieImage src={firstPerk.icon} title={firstPerk.description} />
                </div>
              ) : (
                <div className="perk-addition-text-container">
                  <AppIcon icon={plusIcon} />
                  <small className="perk-addition-text">{t('LB.LockPerk')}</small>
                </div>
              )}
            </div>
          </div>
        ) : (
          <ClosableContainer className="lock-container" onClose={() => onRemove({ type })}>
            <LoadoutBuilderItem item={lockeditem} />
          </ClosableContainer>
        )}
        <div className="label">{i18nItemNames[type]}</div>
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
    </div>
  );
}
