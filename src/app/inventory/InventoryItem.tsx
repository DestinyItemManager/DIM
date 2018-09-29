import * as React from 'react';
import classNames from 'classnames';
import { DimItem } from './item-types';
import { percent } from './dimPercentWidth.directive';
import BungieImage, { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import { getColor, dtrRatingColor } from '../shell/dimAngularFilters.filter';
import { tagIconFilter } from './dimStoreItem.directive';
import ItemRender from './ItemRender';
// tslint:disable-next-line:no-implicit-dependencies
import newOverlay from 'app/images/overlay.svg';
import './dimStoreItem.scss';
import './InventoryItem.scss';
import './DarkTile.scss';
import { TagValue } from './dim-item-info';
import getBadgeInfo from './get-badge-info';
import { settings } from '../settings/settings';

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
  /** TODO: item locked needs to be passed in */
  onClick?(e);
  onDoubleClick?(e);
}

const tagClasses = tagIconFilter();

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
      capped: badgeInfo.isCapped,
      exotic: item.isExotic
    };

    const elaborateTile =
      $featureFlags.forsakenTiles &&
      settings.betaForsakenTiles &&
      item.isDestiny2 &&
      item.isDestiny2() &&
      (item.primStat || item.sockets);

    const darkTiles = true;

    return (
      <div
        id={item.index}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        title={`${item.name}\n${item.typeName}`}
        className={classNames(
          'item',
          {
            'search-hidden': searchHidden,
            'd2-item': elaborateTile
          },
          item.dmg || '',
          item.isDestiny2() && item.ammoType > 0 ? 'ammo-overlay ammo-type-' + item.ammoType : ''
        )}
      >
        {elaborateTile && item.isDestiny2 && item.isDestiny2() ? (
          <ItemRender
            item={item}
            badge={badgeInfo}
            rating={rating}
            hideRating={hideRating}
            tag={tag}
          />
        ) : darkTiles ? (
          <div className={classNames(itemImageStyles)}>
            {item.percentComplete > 0 &&
              !item.complete && (
                <div
                  className="item-xp-bar-small"
                  style={{ width: percent(item.percentComplete) }}
                />
              )}
            <div className="overlay" />
            <div className="item-img" style={bungieBackgroundStyle(item.icon)} />
            {item.isDestiny1() &&
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
                <div className={classNames('item-stat', 'item-review')}>
                  <i
                    className={classNames(
                      rating > 4 ? 'fa fa-star' : rating > 2 ? 'fa fa-star-half-o' : 'fa fa-star-o',
                      { godroll: rating === 5 }
                    )}
                  />
                  {sliceRating(rating)}
                </div>
              )}
            {tag && <div className={tagClasses(tag)} />}
            {item.locked && <div className="item-tag fa fa-lock" />}
            {isNew && (
              <div className="new_overlay_overflow">
                <img className="new_overlay" src={newOverlay} height="44" width="44" />
              </div>
            )}
            {badgeInfo.showBadge && (
              <div className={classNames(badgeInfo.badgeClassNames)}>
                {item.dmg === 'void' && (
                  <BungieImage
                    className="element void"
                    src="/img/destiny_content/damage_types/destiny2/void.png"
                  />
                )}
                {item.dmg === 'solar' && (
                  <BungieImage
                    className="element"
                    src="/img/destiny_content/damage_types/destiny2/thermal.png"
                  />
                )}
                {item.dmg === 'arc' && (
                  <BungieImage
                    className="element"
                    src="/img/destiny_content/damage_types/destiny2/arc.png"
                  />
                )}
                {badgeInfo.badgeCount}
              </div>
            )}
          </div>
        ) : (
          <div>
            {item.percentComplete > 0 &&
              !item.complete && (
                <div
                  className="item-xp-bar-small"
                  style={{ width: percent(item.percentComplete) }}
                />
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
                  <i className="fa fa-star" style={dtrRatingColor(rating)} />
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
        )}
      </div>
    );
  }
}

function sliceRating(rating: number) {
  const whole = Math.floor(rating);
  const parts = rating.toString().split('.');

  return (
    <>
      <span>{whole}</span>
      {parts.length > 1 && <span className="decimal">.{parts[1]}</span>}
    </>
  );
}
