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
import ElementIcon from './ElementIcon';
import { energyCapacityTypeNames } from '../item-popup/EnergyMeter';
import { UiWishListRoll } from 'app/wishlists/wishlists';

interface Props {
  item: DimItem;
  isCapped: boolean;
  /** Rating value */
  rating?: number;
  uiWishListRoll?: UiWishListRoll;
}

const getGhostInfos = weakMemoize((item: DimItem) =>
  item.isDestiny2 &&
  item.isDestiny2() &&
  item.sockets &&
  item.itemCategoryHashes &&
  item.itemCategoryHashes.includes(39)
    ? _.compact(
        item.sockets.sockets.map((s) => {
          const hash = s.plug?.plugItem?.hash;
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
    item.itemCategoryHashes?.includes(39)
  );
}

export default function BadgeInfo({ item, isCapped, rating, uiWishListRoll }: Props) {
  const isBounty = Boolean(!item.primStat && item.objectives);
  const isStackable = Boolean(item.maxStackSize > 1);
  // treat D1 ghosts as generic items
  const isGhost = Boolean(
    item.isDestiny2 && item.isDestiny2() && item.itemCategoryHashes?.includes(39)
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
    [styles.masterwork]: item.masterwork
  };

  const badgeContent =
    (isBounty && `${Math.floor(100 * item.percentComplete)}%`) ||
    (isStackable && item.amount.toString()) ||
    (isGhost && ghostBadgeContent(item)) ||
    (isGeneric && item.primStat?.value.toString()) ||
    (item.classified && '???');

  const reviewclsx = {
    [styles.review]: true,
    [styles.wishlistRoll]: uiWishListRoll && uiWishListRoll === UiWishListRoll.Good
  };

  const badgeElement =
    item.dmg ||
    (item.isDestiny2() && item.energy && energyCapacityTypeNames[item.energy.energyType]) ||
    null;

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
        {badgeElement && <ElementIcon element={badgeElement} />}
        <span>{badgeContent}</span>
      </div>
    </div>
  );
}

function ghostBadgeContent(item: DimItem) {
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
