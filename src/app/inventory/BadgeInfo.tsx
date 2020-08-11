import React from 'react';
import { t } from 'app/i18next-t';
import { DimItem } from './item-types';
import { getColor } from '../shell/filters';
import ghostPerks from 'data/d2/ghost-perks.json';
import _ from 'lodash';
import { weakMemoize } from 'app/utils/util';
import RatingIcon from './RatingIcon';
import clsx from 'clsx';
import styles from './BadgeInfo.m.scss';
import iconStyles from 'app/inventory/ElementIcon.m.scss';
import ElementIcon from './ElementIcon';
import { UiWishListRoll } from 'app/wishlists/wishlists';
import { DamageType } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';

interface Props {
  item: DimItem;
  isCapped: boolean;
  /** Rating value */
  rating?: number;
  uiWishListRoll?: UiWishListRoll;
}

const getGhostInfos = weakMemoize((item: DimItem) =>
  item.isDestiny2?.() && item.sockets && item.itemCategoryHashes.includes(ItemCategoryHashes.Ghost)
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

export default function BadgeInfo({ item, isCapped, rating, uiWishListRoll }: Props) {
  const isBounty = Boolean(!item.primStat && item.objectives);
  const isStackable = Boolean(item.maxStackSize > 1);
  // treat D1 ghosts as generic items
  const isGhost = Boolean(
    item.isDestiny2?.() && item.itemCategoryHashes?.includes(ItemCategoryHashes.Ghost)
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

  const badgeclsx = {
    [styles.fullstack]: isStackable && item.amount === item.maxStackSize,
    [styles.capped]: isCapped,
    [styles.masterwork]: item.masterwork,
  };

  const badgeContent =
    (isBounty && `${Math.floor(100 * item.percentComplete)}%`) ||
    (isStackable && item.amount.toString()) ||
    (isGhost && ghostBadgeContent(item)) ||
    (isGeneric && item.primStat?.value.toString()) ||
    (item.classified && '???');

  const reviewclsx = {
    [styles.review]: true,
    [styles.wishlistRoll]: uiWishListRoll,
  };

  return (
    <div className={clsx(styles.badge, badgeclsx)}>
      {item.isDestiny1() && item.quality && (
        <div className={styles.quality} style={getColor(item.quality.min, 'backgroundColor')}>
          {item.quality.min}%
        </div>
      )}
      {(rating !== undefined || uiWishListRoll) && (
        <div className={clsx(reviewclsx)}>
          <RatingIcon rating={rating || 1} uiWishListRoll={uiWishListRoll} />
        </div>
      )}
      <div className={styles.primaryStat}>
        {/*
        // this is where the item's total energy capacity would go if we could just add things willy nilly to the badge bar
        item.isDestiny2() && item.energy && (<span className={clsx(energyTypeStyles[item.energy.energyType], styles.energyCapacity)}>
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
    // t('Ghost.crucible')  t('Ghost.dreaming')   t('Ghost.edz')      t('Ghost.gambit')
    // t('Ghost.io')        t('Ghost.leviathan')  t('Ghost.mars')     t('Ghost.mercury')
    // t('Ghost.nessus')    t('Ghost.strikes')    t('Ghost.tangled')  t('Ghost.titan')
    // t('Ghost.moon')
    .map((location) => t(`Ghost.${location}`))
    .join(',');
  const improved = infos.some((i) => i.type.improved) ? '+' : '';

  return [planet, improved];
}
