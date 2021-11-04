import { isD1Item } from 'app/utils/item-utils';
import { InventoryWishListRoll, toUiWishListRoll } from 'app/wishlists/wishlists';
import { DamageType, DestinyEnergyType } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';
import { useSelector } from 'react-redux';
import ElementIcon from '../dim-ui/ElementIcon';
import { getColor } from '../shell/filters';
import styles from './BadgeInfo.m.scss';
import { itemNoteSelector } from './dim-item-info';
import { DimItem } from './item-types';
import RatingIcon from './RatingIcon';

const energyTypeStyles: Record<DestinyEnergyType, string> = {
  [DestinyEnergyType.Arc]: styles.arc,
  [DestinyEnergyType.Thermal]: styles.solar,
  [DestinyEnergyType.Void]: styles.void,
  [DestinyEnergyType.Ghost]: '',
  [DestinyEnergyType.Subclass]: '',
  [DestinyEnergyType.Stasis]: styles.stasis,
  [DestinyEnergyType.Any]: '',
};

interface Props {
  item: DimItem;
  isCapped: boolean;
  wishlistRoll?: InventoryWishListRoll;
}

export default function BadgeInfo({ item, isCapped, wishlistRoll }: Props) {
  const savedNotes = useSelector(itemNoteSelector(item));
  const isBounty = Boolean(!item.primaryStat && item.objectives);
  const isStackable = Boolean(item.maxStackSize > 1);
  const isGeneric = !isBounty && !isStackable;
  const wishlistRollIcon = toUiWishListRoll(wishlistRoll);

  const hideBadge = Boolean(
    (item.isEngram && item.location.hash === BucketHashes.Engrams) ||
      (isBounty && (item.complete || item.hidePercentage)) ||
      (isStackable && item.amount === 1) ||
      (isGeneric && !item.primaryStat?.value && !item.classified)
  );

  if (hideBadge) {
    return null;
  }

  const badgeContent =
    (isBounty && `${Math.floor(100 * item.percentComplete)}%`) ||
    (isStackable && item.amount.toString()) ||
    (isGeneric && item.primaryStat?.value.toString()) ||
    (item.classified && (savedNotes ?? '???'));

  const fixContrast =
    (item.energy &&
      (item.energy.energyType === DestinyEnergyType.Arc ||
        item.energy.energyType === DestinyEnergyType.Void)) ||
    (item.element &&
      (item.element.enumValue === DamageType.Arc || item.element.enumValue === DamageType.Void));

  return (
    <div
      className={clsx(styles.badge, {
        [styles.fullstack]: isStackable && item.amount === item.maxStackSize,
        [styles.capped]: isCapped,
        [styles.masterwork]: item.masterwork,
        [styles.engram]: item.isEngram,
      })}
    >
      {isD1Item(item) && item.quality && (
        <div className={styles.quality} style={getColor(item.quality.min, 'backgroundColor')}>
          {item.quality.min}%
        </div>
      )}
      {wishlistRollIcon && (
        <div
          className={clsx({
            [styles.wishlistRoll]: wishlistRollIcon,
          })}
        >
          <RatingIcon uiWishListRoll={wishlistRollIcon} />
        </div>
      )}
      {item.energy ? (
        <span className={clsx(energyTypeStyles[item.energy.energyType], styles.energyCapacity)}>
          {item.energy.energyCapacity}
          <ElementIcon
            element={item.element}
            className={clsx(styles.energyCapacityIcon, { [styles.fixContrast]: fixContrast })}
          />
        </span>
      ) : (
        item.element &&
        !(item.bucket.inWeapons && item.element.enumValue === DamageType.Kinetic) && (
          <ElementIcon
            element={item.element}
            className={clsx({ [styles.fixContrast]: fixContrast })}
          />
        )
      )}
      <span>{badgeContent}</span>
    </div>
  );
}
