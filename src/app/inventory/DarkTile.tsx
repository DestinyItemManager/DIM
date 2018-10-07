import * as React from 'react';
import { DimItem } from './item-types';
import { BadgeInfo } from './get-badge-info';
import { TagValue } from './dim-item-info';
import { percent } from './dimPercentWidth.directive';
import BungieImage, { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import { getColor } from '../shell/dimAngularFilters.filter';
import classNames from 'classnames';
import { tagIconFilter } from './dimStoreItem.directive';
// tslint:disable-next-line:no-implicit-dependencies
import newOverlay from 'app/images/overlay.svg';
import './DarkTile.scss';

const tagClasses = tagIconFilter();

const newOverlayElement = (
  <div className="new_overlay_overflow">
    <img className="new_overlay" src={newOverlay} height="44" width="44" />
  </div>
);

export default function DarkItemTile({
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
  const itemImageStyles = {
    complete: item.complete,
    diamond:
      (item.isDestiny2 && item.isDestiny2() && item.bucket.hash === 3284755031) || item.isEngram,
    masterwork: item.masterwork,
    capped: badgeInfo.isCapped,
    exotic: item.isExotic
  };

  return (
    <div className={classNames(itemImageStyles)}>
      {item.percentComplete > 0 &&
        !item.complete && (
          <div className="item-xp-bar-small" style={{ width: percent(item.percentComplete) }} />
        )}
      <div className="overlay" />
      <div
        style={bungieBackgroundStyle(item.icon)}
        className={classNames(
          'item-img',
          item.isDestiny2() && item.ammoType > 0 ? 'ammo-overlay ammo-type-' + item.ammoType : ''
        )}
      />
      {tag && <div className={tagClasses(tag)} />}
      {item.locked && <div className="item-tag fa fa-lock" />}
      {isNew && newOverlayElement}
      {badgeInfo.showBadge && (
        <div className={classNames('tile-info', badgeInfo.badgeClassNames)}>
          {item.isDestiny1() &&
            item.quality && (
              <div className="item-quality" style={getColor(item.quality.min, 'backgroundColor')}>
                {item.quality.min}%
              </div>
            )}
          {rating !== undefined &&
            !hideRating && (
              <div className="item-review">
                <i
                  className={classNames(
                    rating > 4 ? 'fa fa-star' : rating > 2 ? 'fa fa-star-half-o' : 'fa fa-star-o',
                    { godroll: rating === 5 }
                  )}
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
