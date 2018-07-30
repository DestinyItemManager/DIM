import * as React from 'react';
import classNames from 'classnames';
import { DimItem } from './item-types';
import { percent } from './dimPercentWidth.directive';
import { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import { getColor, dtrRatingColor } from '../shell/dimAngularFilters.filter';
import { tagIconFilter } from './dimStoreItem.directive';
// tslint:disable-next-line:no-implicit-dependencies
import newOverlay from 'app/images/overlay.svg';
import './dimStoreItem.scss';

interface Props {
  item: DimItem;
  onClick?(e);
  onDoubleClick?(e);
}

// TODO: Separate high and low levels (display vs display logic)
export default class InventoryItem extends React.Component<Props> {
  render() {
    const { item, onClick, onDoubleClick } = this.props;

    const itemImageStyles = {
      complete: item.complete,
      diamond: item.destinyVersion === 2 && item.bucket.hash === 3284755031,
      masterwork: item.masterwork
    };

    const showRating =
      item.dtrRating &&
      item.dtrRating.overallScore &&
      (item.dtrRating.ratingCount > (item.destinyVersion === 2 ? 0 : 1) ||
        item.dtrRating.highlightedRatingCount > 0);

    const badgeInfo = getBadgeInfo(item);

    return (
      <div
        id={item.index}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        title={`${item.name}\n${item.typeName}`}
        className={classNames('item', { 'search-hidden': !item.visible })}
      >
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
        {item.isDestiny1() &&
          item.quality && (
            <div
              className="item-stat item-quality"
              style={getColor(item.quality.min, 'backgroundColor')}
            >
              {item.quality.min}%
            </div>
          )}
        {item.dtrRating &&
          showRating && (
            <div className="item-stat item-review">
              {item.dtrRating.overallScore}
              <i
                className="fa fa-star"
                style={dtrRatingColor(item.dtrRating.overallScore)}
              />
            </div>
          )}
        <div className={classNames('item-element', item.dmg)} />
        <div className={tagIconFilter()(item.dimInfo.tag)} />
        {item.isNew && (
          <div className="new_overlay_overflow">
            <img
              className="new_overlay"
              src={newOverlay}
              height="44"
              width="44"
            />
          </div>
        )}
        {badgeInfo.showBadge && (
          <div className={classNames(badgeInfo.badgeClassNames)}>
            {badgeInfo.badgeCount}
          </div>
        )}
      </div>
    );
  }
}

function getBadgeInfo(
  item: DimItem
): {
  showBadge: boolean;
  badgeClassNames: { [key: string]: boolean };
  badgeCount: string;
} {
  if (!item.primStat && item.objectives) {
    return processBounty(item);
  } else if (item.maxStackSize > 1) {
    return processStackable(item);
  } else {
    return processItem(item);
  }
}

function processBounty(item: DimItem) {
  const showBountyPercentage = !item.complete && !item.hidePercentage;

  const result = {
    showBadge: showBountyPercentage,
    badgeClassNames: {},
    badgeCount: ''
  };

  if (showBountyPercentage) {
    result.badgeClassNames = { 'item-stat': true, 'item-bounty': true };
    result.badgeCount = `${Math.floor(100 * item.percentComplete)}%`;
  }

  return result;
}

function processStackable(item: DimItem) {
  return {
    showBadge: true,
    badgeClassNames: { 'item-stat': true, 'item-stackable': true },
    badgeCount: item.amount.toString()
  };
}

function processItem(item: DimItem) {
  const result = {
    showBadge: Boolean(item.primStat && item.primStat.value),
    badgeClassNames: {
      'item-equipment': true
    },
    badgeCount: ''
  };
  if (item.primStat && result.showBadge) {
    result.badgeClassNames['item-stat'] = true;
    result.badgeCount = item.primStat.value.toString();
  }
  return result;
}
