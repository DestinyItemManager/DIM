import { itemHashTagsSelector, itemInfosSelector } from 'app/inventory/selectors';
import { RootState } from 'app/store/types';
import { isD1Item } from 'app/utils/item-utils';
import { UiWishListRoll } from 'app/wishlists/wishlists';
import { DamageType, DestinyEnergyType } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import { useSelector } from 'react-redux';
import ElementIcon from '../dim-ui/ElementIcon';
import { getColor } from '../shell/filters';
import styles from './BadgeInfo.m.scss';
import { getNotes } from './dim-item-info';
import { DimItem } from './item-types';
import RatingIcon from './RatingIcon';

const energyTypeStyles: Record<DestinyEnergyType, string> = {
  [DestinyEnergyType.Arc]: styles.arc,
  [DestinyEnergyType.Thermal]: styles.solar,
  [DestinyEnergyType.Void]: styles.void,
  [DestinyEnergyType.Any]: '',
};

interface Props {
  item: DimItem;
  isCapped: boolean;
  uiWishListRoll?: UiWishListRoll;
}

export function hasBadge(item?: DimItem | null): boolean {
  if (!item) {
    return false;
  }
  if (item.isEngram && item.location.capacity === 10) {
    return false;
  }
  return (
    Boolean(item.primStat?.value) ||
    item.classified ||
    (item.objectives && !item.complete && !item.hidePercentage) ||
    (item.maxStackSize > 1 && item.amount > 1) ||
    item.itemCategoryHashes?.includes(ItemCategoryHashes.Ghost)
  );
}

export default function BadgeInfo({ item, isCapped, uiWishListRoll }: Props) {
  const savedNotes = useSelector<RootState, string | undefined>((state) =>
    getNotes(item, itemInfosSelector(state), itemHashTagsSelector(state))
  );
  const isBounty = Boolean(!item.primStat && item.objectives);
  const isStackable = Boolean(item.maxStackSize > 1);
  const isGeneric = !isBounty && !isStackable;

  const hideBadge = Boolean(
    (item.isEngram && item.location.capacity === 10) ||
      (isBounty && (item.complete || item.hidePercentage)) ||
      (isStackable && item.amount === 1) ||
      (isGeneric && !item.primStat?.value && !item.classified)
  );

  if (hideBadge) {
    return null;
  }

  const badgeContent =
    (isBounty && `${Math.floor(100 * item.percentComplete)}%`) ||
    (isStackable && item.amount.toString()) ||
    (isGeneric && item.primStat?.value.toString()) ||
    (item.classified && (savedNotes ?? '???'));

  return (
    <div
      className={clsx(styles.badge, {
        [styles.fullstack]: isStackable && item.amount === item.maxStackSize,
        [styles.capped]: isCapped,
        [styles.masterwork]: item.masterwork,
      })}
    >
      {isD1Item(item) && item.quality && (
        <div className={styles.quality} style={getColor(item.quality.min, 'backgroundColor')}>
          {item.quality.min}%
        </div>
      )}
      {uiWishListRoll && (
        <div
          className={clsx({
            [styles.wishlistRoll]: uiWishListRoll,
          })}
        >
          <RatingIcon uiWishListRoll={uiWishListRoll} />
        </div>
      )}
      {item.energy ? (
        <span className={clsx(energyTypeStyles[item.energy.energyType], styles.energyCapacity)}>
          {item.energy.energyCapacity}
          <ElementIcon element={item.element} className={styles.energyCapacityIcon} />
        </span>
      ) : (
        item.element &&
        !(item.bucket.inWeapons && item.element.enumValue === DamageType.Kinetic) && (
          <ElementIcon element={item.element} className={styles.lightBackgroundElement} />
        )
      )}
      <span>{badgeContent}</span>
    </div>
  );
}
