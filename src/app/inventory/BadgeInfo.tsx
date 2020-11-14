import { t } from 'app/i18next-t';
import { isD1Item } from 'app/utils/item-utils';
import { weakMemoize } from 'app/utils/util';
import { UiWishListRoll } from 'app/wishlists/wishlists';
import { DamageType, DestinyEnergyType } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import ghostPerks from 'data/d2/ghost-perks.json';
import _ from 'lodash';
import React from 'react';
import ElementIcon from '../dim-ui/ElementIcon';
import { getColor } from '../shell/filters';
import styles from './BadgeInfo.m.scss';
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

const getGhostInfos = weakMemoize((item: DimItem) =>
  item.sockets && item.itemCategoryHashes.includes(ItemCategoryHashes.Ghost)
    ? _.compact(
        item.sockets.allSockets.map((s) => {
          const hash = s.plugged?.plugDef?.hash;
          return hash && ghostPerks[hash];
        })
      )
    : []
);

export function hasBadge(item?: DimItem | null): boolean {
  if (!item) {
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
  const isBounty = Boolean(!item.primStat && item.objectives);
  const isStackable = Boolean(item.maxStackSize > 1);
  // treat D1 ghosts as generic items
  const isGhost = Boolean(
    item?.destinyVersion === 2 && item.itemCategoryHashes?.includes(ItemCategoryHashes.Ghost)
  );
  const isGeneric = !isBounty && !isStackable && !isGhost;

  const ghostInfos = getGhostInfos(item);

  const hideBadge = Boolean(
    (isBounty && (item.complete || item.hidePercentage)) ||
      (isStackable && item.amount === 1) ||
      (isGhost && !ghostInfos.length && !item.classified) ||
      (isGeneric && !item.primStat?.value && !item.classified)
  );

  if (hideBadge) {
    return null;
  }

  const badgeContent =
    (isBounty && `${Math.floor(100 * item.percentComplete)}%`) ||
    (isStackable && item.amount.toString()) ||
    (isGhost && ghostBadgeContent(item)) ||
    (isGeneric && item.primStat?.value.toString()) ||
    (item.classified && '???');

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

export function ghostBadgeContent(item: DimItem) {
  const infos = getGhostInfos(item);

  const planet = _.uniq(infos.map((i) => i.location).filter((l) => l !== true && l !== false))
    // t('Ghost.', { context: '', contextList: 'ghost_locations' })
    .map((location) => t(`Ghost.${location}`))
    .join(',');
  const improved = infos.some((i) => i.type.improved) ? '+' : '';

  return [planet, improved];
}
