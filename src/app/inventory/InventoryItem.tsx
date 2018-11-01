import * as React from 'react';
import classNames from 'classnames';
import { DimItem } from './item-types';
import { percent } from './dimPercentWidth.directive';
import { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import { getColor } from '../shell/dimAngularFilters.filter';
// tslint:disable-next-line:no-implicit-dependencies
import newOverlay from 'app/images/overlay.svg';
import './dimStoreItem.scss';
import './InventoryItem.scss';
import { TagValue, itemTags } from './dim-item-info';
import getBadgeInfo from './get-badge-info';
import { RatingIcon } from '../shell/icons/ReviewIcon';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { AppIcon } from '../shell/icons';

interface Props {
  item: DimItem;
  /** Show this item as new? */
  isNew?: boolean;
  /** User defined tag */
  tag?: TagValue;
  /** Rating value */
  rating?: number;
  hideRating?: boolean;
  /** Has this been hidden by a search? */
  searchHidden?: boolean;
  onClick?(e);
  onDoubleClick?(e);
}

const iconType: { [P in TagValue]?: IconDefinition | undefined } = {};

itemTags.forEach((tag) => {
  if (tag.type) {
    iconType[tag.type] = tag.icon;
  }
});

// TODO: Separate high and low levels (display vs display logic)
export default class InventoryItem extends React.Component<Props> {
  render() {
    const {
      item,
      isNew,
      tag,
      rating,
      searchHidden,
      hideRating,
      onClick,
      onDoubleClick
    } = this.props;

    const badgeInfo = getBadgeInfo(item);

    const itemImageStyles = {
      complete: item.complete,
      diamond:
        (item.isDestiny2 && item.isDestiny2() && item.bucket.hash === 3284755031) || item.isEngram,
      masterwork: item.masterwork,
      capped: badgeInfo.isCapped
    };

    return (
      <div
        id={item.index}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        title={`${item.name}\n${item.typeName}`}
        className={classNames('item', {
          'search-hidden': searchHidden
        })}
      >
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
                {rating}
                <RatingIcon rating={rating} />
              </div>
            )}
          <div className={classNames('item-element', item.dmg)} />
          {tag && iconType[tag] && <AppIcon className="item-tag" icon={iconType[tag]!} />}
          {isNew && (
            <div className="new_overlay_overflow">
              <img className="new_overlay" src={newOverlay} height="44" width="44" />
            </div>
          )}
          {badgeInfo.showBadge && (
            <div className={classNames(badgeInfo.badgeClassNames)}>{badgeInfo.badgeCount}</div>
          )}
        </div>
      </div>
    );
  }
}
