import { t } from 'app/i18next-t';
import iconStyles from 'app/inventory/ElementIcon.m.scss';
import { isD1Item } from 'app/utils/item-utils';
import { weakMemoize } from 'app/utils/util';
import { UiWishListRoll } from 'app/wishlists/wishlists';
import { DamageType } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import ghostPerks from 'data/d2/ghost-perks.json';
import _ from 'lodash';
import React from 'react';
import { getColor } from '../shell/filters';
import styles from './BadgeInfo.m.scss';
import ElementIcon from './ElementIcon';
import { DimItem } from './item-types';
import RatingIcon from './RatingIcon';

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
      <div className={styles.primaryStat}>
        {/*
        // this is where the item's total energy capacity would go if we could just add things willy nilly to the badge bar
        item.energy && (<span className={clsx(energyTypeStyles[item.energy.energyType], styles.energyCapacity)}>
        {item.energy.energyCapacity}</span>)
        */}
        {item.element &&
          !(item.bucket.inWeapons && item.element.enumValue === DamageType.Kinetic) && (
            <ElementIcon element={item.element} className={iconStyles.lightBackground} />
          )}
        <span>{badgeContent}</span>
      </div>
    </div>
  );
}

export function ghostBadgeContent(item: DimItem) {
  const infos = getGhostInfos(item);

  const planet = _.uniq(infos.map((i) => i.location).filter((l) => l !== true && l !== false))
    .map((location) => t('Ghost.', { context: location, contextList: 'ghost_locations' }))
    .join(',');
  const improved = infos.some((i) => i.type.improved) ? '+' : '';

  return [planet, improved];
}
