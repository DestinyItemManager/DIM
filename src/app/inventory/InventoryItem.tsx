import * as React from 'react';
import classNames from 'classnames';
import { DimItem } from './item-types';
import './dimStoreItem.scss';
import './InventoryItem.scss';
import './DarkTile.scss';
import { TagValue } from './dim-item-info';
import getBadgeInfo from './get-badge-info';
import DarkItemTile from './DarkTile';
import ClassicTile from './ClassicTile';

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
            'search-hidden': searchHidden
          },
          item.dmg || '',
          item.isDestiny2() && item.ammoType > 0 ? 'ammo-overlay ammo-type-' + item.ammoType : ''
        )}
      >
        {darkTiles && item.maxStackSize === 1 ? (
          <DarkItemTile
            item={item}
            badgeInfo={badgeInfo}
            rating={rating}
            hideRating={hideRating}
            tag={tag}
            isNew={Boolean(isNew)}
          />
        ) : (
          <ClassicTile
            item={item}
            badgeInfo={badgeInfo}
            rating={rating}
            hideRating={hideRating}
            tag={tag}
            isNew={Boolean(isNew)}
          />
        )}
      </div>
    );
  }
}
