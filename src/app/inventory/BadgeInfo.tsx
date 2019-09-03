import React from 'react';
import { t } from 'app/i18next-t';
import { DimItem } from './item-types';
import { getColor } from '../shell/filters';
import ghostPerks from 'data/d2/ghost-perks.json';
import _ from 'lodash';
import idx from 'idx';
import { weakMemoize } from 'app/util';
import RatingIcon from './RatingIcon';
import BungieImage from '../dim-ui/BungieImage';
import classNames from 'classnames';

interface Props {
  item: DimItem;
  isCapped: boolean;
  /** Rating value */
  rating?: number;
  hideRating?: boolean;
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

export default class BadgeInfo extends React.Component<Props> {
  render() {
    const { item, isCapped, rating, hideRating } = this.props;

    const itemIs = {
      bounty: Boolean(!item.primStat && item.objectives),
      stackable: Boolean(item.maxStackSize > 1),
      // treat D1 ghosts as generic items
      ghost: Boolean(
        item.isDestiny2 &&
          item.isDestiny2() &&
          item.itemCategoryHashes &&
          item.itemCategoryHashes.includes(39)
      ),
      generic: false
    };
    itemIs.generic = !Object.values(itemIs).some(Boolean);

    const ghostInfos = getGhostInfos(item);

    const hideBadge = Boolean(
      (itemIs.bounty && (item.complete || item.hidePercentage)) ||
        (itemIs.stackable && item.amount === 1) ||
        (itemIs.ghost && !ghostInfos.length && !item.classified) ||
        (itemIs.generic && !(item.primStat && item.primStat.value) && !item.classified)
    );

    const badgeClassNames = {
      'item-stat': !(itemIs.bounty && (item.complete || item.hidePercentage)),
      'item-bounty': itemIs.bounty && (!item.complete && !item.hidePercentage),
      'item-equipment': !itemIs.bounty && !itemIs.stackable,
      'item-stackable-max': itemIs.stackable && item.amount === item.maxStackSize,
      'badge-capped': isCapped
    };

    const badgeContent =
      (itemIs.bounty && `${Math.floor(100 * item.percentComplete)}%`) ||
      (itemIs.stackable && (isCapped ? `${t('Badge.Max')} ` : '') + item.amount.toString()) ||
      (itemIs.ghost && ghostBadgeContent(item)) ||
      (itemIs.generic && item.primStat && item.primStat.value.toString()) ||
      (item.classified && '???');

    return (
      !hideBadge && (
        <div className={classNames(badgeClassNames)}>
          {item.isDestiny1() && item.quality && (
            <div className="item-quality" style={getColor(item.quality.min, 'backgroundColor')}>
              {item.quality.min}%
            </div>
          )}
          {rating !== undefined && !hideRating && (
            <div className="item-review">
              <RatingIcon rating={rating} />
            </div>
          )}
          <div className="primary-stat">
            {item.dmg && <ElementIcon element={item.dmg} />}
            {badgeContent}
          </div>
        </div>
      )
    );
  }
}

function ghostBadgeContent(item: DimItem) {
  const infos = getGhostInfos(item);

  const planet = _.uniq(infos.map((i) => i.location).filter((l) => l !== true && l !== false))
    .map((location) => t(`Ghost.${location}`))
    .join(',');
  const improved = infos.some((i) => i.type.improved) ? '+' : '';

  return [planet, improved];
}

function ElementIcon({ element }: { element: DimItem['dmg'] }) {
  const images = {
    arc: 'arc',
    solar: 'thermal',
    void: 'void'
  };

  if (images[element]) {
    return (
      <BungieImage
        className={`element ${element}`}
        src={`/img/destiny_content/damage_types/destiny2/${images[element]}.png`}
      />
    );
  }
  return null;
}
