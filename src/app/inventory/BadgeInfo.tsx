import React from 'react';
import { t } from 'app/i18next-t';
import { DimItem } from './item-types';
import { getColor } from '../shell/filters';
import ghostPerks from 'data/d2/ghost-perks.json';
import _ from 'lodash';
import idx from 'idx';
import { weakMemoize } from 'app/utils/util';
import RatingIcon from './RatingIcon';
import classNames from 'classnames';
import styles from './BadgeInfo.m.scss';
import ElementIcon from './ElementIcon';
import { energyCapacitiesByName } from '../search/search-filter-hashes';

interface Props {
  item: DimItem;
  isCapped: boolean;
  /** Rating value */
  rating?: number;
  isWishListRoll: boolean;
}

const getGhostInfos = weakMemoize((item: DimItem) =>
  item.isDestiny2 &&
  item.isDestiny2() &&
  item.sockets &&
  item.itemCategoryHashes &&
  item.itemCategoryHashes.includes(39)
    ? _.compact(
        item.sockets.sockets.map((s) => {
          const hash = idx(s.plug, (p) => p.plugItem.hash);
          return hash && ghostPerks[hash];
        })
      )
    : []
);

const armorElements = Object.entries(energyCapacitiesByName).reduce(
  (obj, [key, value]) => ({ ...obj, [value]: key }),
  {}
);

export function hasBadge(item?: DimItem | null): boolean {
  if (!item) {
    return false;
  }
  return (
    Boolean(item.primStat && item.primStat.value) ||
    item.classified ||
    (item.objectives && !item.complete && !item.hidePercentage) ||
    (item.maxStackSize > 1 && item.amount > 1) ||
    (item.itemCategoryHashes && item.itemCategoryHashes.includes(39))
  );
}

export default function BadgeInfo({ item, isCapped, rating, isWishListRoll }: Props) {
  const isBounty = Boolean(!item.primStat && item.objectives);
  const isStackable = Boolean(item.maxStackSize > 1);
  // treat D1 ghosts as generic items
  const isGhost = Boolean(
    item.isDestiny2 &&
      item.isDestiny2() &&
      item.itemCategoryHashes &&
      item.itemCategoryHashes.includes(39)
  );
  const isGeneric = !isBounty && !isStackable && !isGhost;

  const ghostInfos = getGhostInfos(item);

  const hideBadge = Boolean(
    (isBounty && (item.complete || item.hidePercentage)) ||
      (isStackable && item.amount === 1) ||
      (isGhost && !ghostInfos.length && !item.classified) ||
      (isGeneric && !(item.primStat && item.primStat.value) && !item.classified)
  );

  if (hideBadge) {
    return null;
  }

  const badgeClassNames = {
    [styles.fullstack]: isStackable && item.amount === item.maxStackSize,
    [styles.capped]: isCapped,
    [styles.masterwork]: item.masterwork
  };

  const badgeContent =
    (isBounty && `${Math.floor(100 * item.percentComplete)}%`) ||
    (isStackable && item.amount.toString()) ||
    (isGhost && ghostBadgeContent(item)) ||
    (isGeneric && item.primStat && item.primStat.value.toString()) ||
    (item.classified && '???');

  const reviewClassNames = {
    [styles.review]: true,
    [styles.wishlistRoll]: isWishListRoll
  };

  return (
    <div className={classNames(styles.badge, badgeClassNames)}>
      {item.isDestiny1() && item.quality && (
        <div className={styles.quality} style={getColor(item.quality.min, 'backgroundColor')}>
          {item.quality.min}%
        </div>
      )}
      {(rating !== undefined || isWishListRoll) && (
        <div className={classNames(reviewClassNames)}>
          <RatingIcon rating={rating || 1} isWishListRoll={isWishListRoll} />
        </div>
      )}
      <div className={styles.primaryStat}>
        {(item.dmg && <ElementIcon element={item.dmg} />) ||
          (item.isDestiny2() &&
            item.masterworkInfo &&
            item.masterworkInfo.statHash &&
            item.masterworkInfo.statHash in armorElements && (
              <ElementIcon element={armorElements[item.masterworkInfo.statHash]} />
            ))}
        {badgeContent}
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
    .map((location) => t(`Ghost.${location}`))
    .join(',');
  const improved = infos.some((i) => i.type.improved) ? '+' : '';

  return [planet, improved];
}
