import React from 'react';
import clsx from 'clsx';
import { DimItem } from './item-types';
import { TagValue } from './dim-item-info';
import BadgeInfo from './BadgeInfo';
import BungieImage, { bungieNetPath } from '../dim-ui/BungieImage';
import { percent } from '../shell/filters';
import { AppIcon, lockIcon, stickyNoteIcon } from '../shell/icons';
import { InventoryWishListRoll, toUiWishListRoll } from '../wishlists/wishlists';
import styles from './InventoryItem.m.scss';
import NewItemIndicator from './NewItemIndicator';
import TagIcon from './TagIcon';
import { selectedSubclassPath } from './subclass';

const itemTierDogearStyles = {
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
  /** Rating value */
  rating?: number;
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
  rating,
  searchHidden,
  wishListsEnabled,
  inventoryWishListRoll,
  ignoreSelectedPerks,
  onClick,
  onShiftClick,
  onDoubleClick,
  innerRef,
}: Props) {
  const isCapped = item.maxStackSize > 1 && item.amount === item.maxStackSize && item.uniqueStack;

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
      item.isDestiny2 &&
      item.isDestiny2() &&
      item.talentGrid &&
      selectedSubclassPath(item.talentGrid)) ||
    null;
  const itemStyles = {
    [styles.searchHidden]: searchHidden,
    [styles.subclassPathTop]: subclassPath?.position === 'top',
    [styles.subclassPathMiddle]: subclassPath?.position === 'middle',
    [styles.subclassPathBottom]: subclassPath?.position === 'bottom',
  };
  const itemImageStyles = clsx('item-img', {
    [styles.complete]: item.complete || isCapped,
    [styles.borderless]: borderless(item),
    [styles.masterwork]: item.masterwork,
  });

  return (
    <div
      id={item.index}
      onClick={enhancedOnClick}
      onDoubleClick={onDoubleClick}
      title={`${item.name}\n${item.typeName}`}
      className={clsx('item', itemStyles)}
      ref={innerRef}
    >
      {item.percentComplete > 0 && !item.complete && (
        <div className={styles.xpBar}>
          <div className={styles.xpBarAmount} style={{ width: percent(item.percentComplete) }} />
        </div>
      )}
      {(subclassPath?.base && <img src={subclassPath.base} className={itemImageStyles} />) || (
        <BungieImage src={item.icon} className={itemImageStyles} alt="" />
      )}
      <BadgeInfo item={item} rating={rating} isCapped={isCapped} uiWishListRoll={uiWishListRoll} />
      {item.masterwork && (
        <div
          className={clsx(styles.masterworkOverlay, { [styles.exoticMasterwork]: item.isExotic })}
        />
      )}
      {item.iconOverlay && (
        <div className={clsx(styles.iconOverlay, itemTierDogearStyles[item.tier])}>
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
      {item.isDestiny2?.() && item.plug?.costElementIcon && (
        <>
          <div
            style={{ backgroundImage: `url("${bungieNetPath(item.plug.costElementIcon)}")` }}
            className="energyCostOverlay"
          />
          <div className="energyCost">{item.plug.energyCost}</div>
        </>
      )}
    </div>
  );
}

export function borderless(item: DimItem) {
  return (
    (item.isDestiny2?.() &&
      (item.bucket.hash === 3284755031 || item.itemCategoryHashes?.includes(268598612))) ||
    item.isEngram
  );
}
