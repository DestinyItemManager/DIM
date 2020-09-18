import clsx from 'clsx';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import React, { useMemo } from 'react';
import BungieImage, { bungieNetPath } from '../dim-ui/BungieImage';
import { percent } from '../shell/filters';
import { AppIcon, lockIcon, stickyNoteIcon } from '../shell/icons';
import { InventoryWishListRoll, toUiWishListRoll } from '../wishlists/wishlists';
import BadgeInfo from './BadgeInfo';
import { TagValue } from './dim-item-info';
import styles from './InventoryItem.m.scss';
import { DimItem } from './item-types';
import NewItemIndicator from './NewItemIndicator';
import { selectedSubclassPath } from './subclass';
import TagIcon from './TagIcon';

const itemTierStyles = {
  Legendary: styles.legendary,
  Exotic: styles.exotic,
  Common: styles.basic,
  Rare: styles.rare,
  Uncommon: styles.common,
};

interface Props {
  item: DimItem;
  /** Show this item as new? */
  isNew?: boolean;
  /** User defined tag */
  tag?: TagValue;
  /**  */
  notes?: boolean;
  /** Has this been hidden by a search? */
  searchHidden?: boolean;
  wishListsEnabled?: boolean;
  inventoryWishListRoll?: InventoryWishListRoll;
  /** Don't show information that relates to currently selected perks (only used for subclasses currently) */
  ignoreSelectedPerks?: boolean;
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
  searchHidden,
  wishListsEnabled,
  inventoryWishListRoll,
  ignoreSelectedPerks,
  onClick,
  onShiftClick,
  onDoubleClick,
  innerRef,
}: Props) {
  const uiWishListRoll = wishListsEnabled ? toUiWishListRoll(inventoryWishListRoll) : undefined;

  let enhancedOnClick = onClick;
  if (onShiftClick) {
    enhancedOnClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.shiftKey) {
        onShiftClick(e);
      } else if (onClick) {
        onClick(e);
      }
    };
  }

  const subclassPath =
    (!ignoreSelectedPerks &&
      item?.destinyVersion === 2 &&
      item.talentGrid &&
      selectedSubclassPath(item.talentGrid)) ||
    null;
  const noBorder = borderless(item);
  const itemStyles = clsx('item', {
    [styles.searchHidden]: searchHidden,
    [styles.subclassPathTop]: subclassPath?.position === 'top',
    [styles.subclassPathMiddle]: subclassPath?.position === 'middle',
    [styles.subclassPathBottom]: subclassPath?.position === 'bottom',
    [itemTierStyles[item.tier]]: !noBorder && !item.plug,
  });

  // Memoize the contents of the item - most of the time if this is re-rendering it's for a search, or a new item
  const contents = useMemo(() => {
    const isCapped = item.maxStackSize > 1 && item.amount === item.maxStackSize && item.uniqueStack;
    const itemImageStyles = clsx('item-img', {
      [styles.complete]: item.complete || isCapped,
      [styles.borderless]: noBorder,
      [styles.masterwork]: item.masterwork,
    });
    return (
      <>
        {item.percentComplete > 0 && !item.complete && (
          <div className={styles.xpBar}>
            <div className={styles.xpBarAmount} style={{ width: percent(item.percentComplete) }} />
          </div>
        )}
        {subclassPath?.base ? (
          <img src={subclassPath.base} className={itemImageStyles} alt="" />
        ) : (
          <BungieImage src={item.icon} className={itemImageStyles} alt="" />
        )}
        <BadgeInfo item={item} isCapped={isCapped} uiWishListRoll={uiWishListRoll} />
        {item.masterwork && (
          <div
            className={clsx(styles.masterworkOverlay, { [styles.exoticMasterwork]: item.isExotic })}
          />
        )}
        {item.iconOverlay && (
          <div className={clsx(styles.iconOverlay)}>
            <BungieImage src={item.iconOverlay} />
          </div>
        )}
        {(tag || item.locked || notes) && (
          <div className={styles.icons}>
            {item.locked && <AppIcon className={styles.icon} icon={lockIcon} />}
            {tag && <TagIcon className={styles.icon} tag={tag} />}
            {notes && <AppIcon className={styles.icon} icon={stickyNoteIcon} />}
          </div>
        )}
        {isNew && <NewItemIndicator />}
        {subclassPath?.super && (
          <BungieImage src={subclassPath.super} className={styles.subclass} alt="" />
        )}
        {item.plug?.costElementIcon && (
          <>
            <div
              style={{ backgroundImage: `url("${bungieNetPath(item.plug.costElementIcon)}")` }}
              className="energyCostOverlay"
            />
            <div className="energyCost">{item.plug.energyCost}</div>
          </>
        )}
      </>
    );
  }, [isNew, item, noBorder, notes, subclassPath?.base, subclassPath?.super, tag, uiWishListRoll]);

  return (
    <div
      id={item.index}
      onClick={enhancedOnClick}
      onDoubleClick={onDoubleClick}
      title={`${item.name}\n${item.typeName}`}
      className={itemStyles}
      ref={innerRef}
    >
      {contents}
    </div>
  );
}

export function borderless(item: DimItem) {
  return (
    (item?.destinyVersion === 2 &&
      (item.bucket.hash === BucketHashes.Subclass ||
        item.itemCategoryHashes?.includes(ItemCategoryHashes.Packages))) ||
    item.isEngram
  );
}
