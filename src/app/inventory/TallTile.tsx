import * as React from 'react';
import { DimItem } from './item-types';
import { BadgeInfo } from './get-badge-info';
import { TagValue, itemTags } from './dim-item-info';
import { percent } from './dimPercentWidth.directive';
import BungieImage, { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import { getColor } from '../shell/dimAngularFilters.filter';
import classNames from 'classnames';
// tslint:disable-next-line:no-implicit-dependencies
import newOverlay from 'app/images/overlay.svg';
import './TallTile.scss';
import { AppIcon, lockIcon, starIcon, halfStarIcon, starOutlineIcon } from '../shell/icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

const tagIcons: { [tag: string]: IconDefinition | undefined } = {};
itemTags.forEach((tag) => {
  if (tag.type) {
    tagIcons[tag.type] = tag.icon;
  }
});

const newOverlayElement = (
  <div className="new_overlay_overflow">
    <img className="new_overlay" src={newOverlay} height="44" width="44" />
  </div>
);

export default function DarkTile({
  item,
  badgeInfo,
  rating,
  hideRating,
  tag,
  isNew
}: {
  item: DimItem;
  badgeInfo: BadgeInfo;
  rating?: number;
  hideRating?: boolean;
  tag?: TagValue;
  isNew: boolean;
}) {
  const borderless =
    (item.isDestiny2 &&
      item.isDestiny2() &&
      (item.bucket.hash === 3284755031 ||
        (item.itemCategoryHashes && item.itemCategoryHashes.includes(268598612)))) ||
    item.isEngram;

  const itemImageStyles = {
    diamond: borderless,
    masterwork: item.masterwork,
    capped: badgeInfo.isCapped,
    exotic: item.isExotic,
    fullstack: item.maxStackSize > 1 && item.amount === item.maxStackSize
  };

  return (
    <div className={classNames(itemImageStyles)}>
      {item.percentComplete > 0 && !item.complete && (
        <div className="item-xp-bar">
          <div className="item-xp-bar-amount" style={{ width: percent(item.percentComplete) }} />
        </div>
      )}
      <div style={bungieBackgroundStyle(item.icon)} className="item-img" />
      {badgeInfo.showBadge && (
        <div className={classNames('tile-info', badgeInfo.badgeClassNames)}>
          {item.isDestiny1() && item.quality && (
            <div className="item-quality" style={getColor(item.quality.min, 'backgroundColor')}>
              {item.quality.min}%
            </div>
          )}
          {rating !== undefined && !hideRating && (
            <div className="item-review">
              <AppIcon
                className={rating === 5 ? 'godroll' : ''}
                icon={rating > 4 ? starIcon : rating > 2 ? halfStarIcon : starOutlineIcon}
              />
              {rating}
            </div>
          )}
          <div className="primary-stat">
            {item.dmg && <ElementIcon element={item.dmg} />}
            {badgeInfo.badgeCount}
          </div>
        </div>
      )}
      {item.masterwork && <div className="overlay" />}
      {(tag || item.locked) && (
        <div className="icons">
          {item.locked && <AppIcon className="item-tag" icon={lockIcon} />}
          {tag && tagIcons[tag] && <AppIcon className="item-tag" icon={tagIcons[tag]!} />}
        </div>
      )}
      {isNew && newOverlayElement}
    </div>
  );
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
