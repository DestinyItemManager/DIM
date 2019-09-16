import React from 'react';
import classNames from 'classnames';
import { DimItem } from './item-types';
import './InventoryItem.scss';
import { TagValue, itemTags } from './dim-item-info';
import BadgeInfo from './BadgeInfo';
import BungieImage from '../dim-ui/BungieImage';
import { percent } from '../shell/filters';
import { AppIcon, lockIcon, thumbsUpIcon, stickyNoteIcon } from '../shell/icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { InventoryCuratedRoll } from '../curated-rolls/curatedRollService';

const tagIcons: { [tag: string]: IconDefinition | undefined } = {};
itemTags.forEach((tag) => {
  if (tag.type) {
    tagIcons[tag.type] = tag.icon;
  }
});

interface Props {
  item: DimItem;
  /** Show this item as new? */
  isNew?: boolean;
  /** User defined tag */
  tag?: TagValue;
  /**  */
  notes?: boolean;
  /** Rating value */
  rating?: number;
  hideRating?: boolean;
  /** Has this been hidden by a search? */
  searchHidden?: boolean;
  curationEnabled?: boolean;
  inventoryCuratedRoll?: InventoryCuratedRoll;
  innerRef?: React.Ref<HTMLDivElement>;
  /** TODO: item locked needs to be passed in */
  onClick?(e);
  onShiftClick?(e): void;
  onDoubleClick?(e);
}

export default function InventoryItem({
  item,
  isNew,
  tag,
  notes,
  rating,
  searchHidden,
  hideRating,
  curationEnabled,
  inventoryCuratedRoll,
  onClick,
  onShiftClick,
  onDoubleClick,
  innerRef
}: Props) {
  const isCapped = item.maxStackSize > 1 && item.amount === item.maxStackSize && item.uniqueStack;

  const itemImageStyles = {
    diamond: borderless(item),
    masterwork: item.masterwork,
    complete: item.complete,
    capped: isCapped,
    exotic: item.isExotic,
    fullstack: item.maxStackSize > 1 && item.amount === item.maxStackSize,
    'search-hidden': searchHidden
  };

  const treatAsCurated = Boolean(curationEnabled && inventoryCuratedRoll);

  if (onShiftClick) {
    onClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.shiftKey) {
        onShiftClick(e);
      } else if (onClick) {
        onClick(e);
      }
    };
  }

  return (
    <div
      id={item.index}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={`${item.name}\n${item.typeName}`}
      className={classNames('item', itemImageStyles)}
      ref={innerRef}
    >
      {item.percentComplete > 0 && !item.complete && (
        <div className="item-xp-bar">
          <div className="item-xp-bar-amount" style={{ width: percent(item.percentComplete) }} />
        </div>
      )}
      <BungieImage src={item.icon} className="item-img" />
      <BadgeInfo item={item} rating={rating} hideRating={hideRating} isCapped={isCapped} />
      {item.masterwork && <div className="overlay" />}
      {(tag || item.locked || treatAsCurated || notes) && (
        <div className="icons">
          {item.locked && <AppIcon className="item-tag" icon={lockIcon} />}
          {tag && tagIcons[tag] && <AppIcon className="item-tag" icon={tagIcons[tag]!} />}
          {treatAsCurated && <AppIcon className="item-tag" icon={thumbsUpIcon} />}
          {notes && <AppIcon className="item-tag" icon={stickyNoteIcon} />}
        </div>
      )}
      {isNew && <div className="new-item" />}
    </div>
  );
}

export function borderless(item: DimItem) {
  return (
    (item.isDestiny2 &&
      item.isDestiny2() &&
      (item.bucket.hash === 3284755031 ||
        (item.itemCategoryHashes && item.itemCategoryHashes.includes(268598612)))) ||
    item.isEngram
  );
}
