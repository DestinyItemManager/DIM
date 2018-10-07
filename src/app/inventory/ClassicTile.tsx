import * as React from 'react';
import { DimItem } from './item-types';
import { BadgeInfo } from './get-badge-info';
import { TagValue } from './dim-item-info';
import { percent } from './dimPercentWidth.directive';
import { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import { getColor } from '../shell/dimAngularFilters.filter';
import classNames from 'classnames';
import { tagIconFilter } from './dimStoreItem.directive';
// tslint:disable-next-line:no-implicit-dependencies
import newOverlay from 'app/images/overlay.svg';

const tagClasses = tagIconFilter();

export default function ClassicTile({
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
    capped: badgeInfo.isCapped
  };

  return (
    <div>
      {item.percentComplete > 0 &&
        !item.complete && (
          <div className="item-xp-bar-small" style={{ width: percent(item.percentComplete) }} />
        )}
      <div
        className={classNames('item-img', itemImageStyles)}
        style={bungieBackgroundStyle(item.icon)}
      />
      {item.isDestiny1 &&
        item.isDestiny1() &&
        item.quality && (
          <div
            className="item-stat item-quality"
            style={getColor(item.quality.min, 'backgroundColor')}
          >
            {item.quality.min}%
          </div>
        )}
      {rating !== undefined &&
        !hideRating && (
          <div className="item-stat item-review">
            <i
              className={
                rating > 4 ? 'fa fa-star' : rating > 2 ? 'fa fa-star-half-o' : 'fa fa-star-o'
              }
            />
            {rating}
          </div>
        )}
      <div className={classNames('item-element', item.dmg)} />
      <div className={tagClasses(tag)} />
      {isNew && (
        <div className="new_overlay_overflow">
          <img className="new_overlay" src={newOverlay} height="44" width="44" />
        </div>
      )}
      {badgeInfo.showBadge && (
        <div className={classNames(badgeInfo.badgeClassNames)}>{badgeInfo.badgeCount}</div>
      )}
    </div>
  );
}
