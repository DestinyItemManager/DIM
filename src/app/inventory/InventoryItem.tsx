import clsx from 'clsx';
import React, { useMemo } from 'react';
import BungieImage from '../dim-ui/BungieImage';
import { percent } from '../shell/filters';
import { AppIcon, lockIcon, stickyNoteIcon } from '../shell/icons';
import { InventoryWishListRoll, toUiWishListRoll } from '../wishlists/wishlists';
import BadgeInfo from './BadgeInfo';
import { TagValue } from './dim-item-info';
import styles from './InventoryItem.m.scss';
import { DimItem } from './item-types';
import ItemIcon from './ItemIcon';
import NewItemIndicator from './NewItemIndicator';
import { selectedSubclassPath } from './subclass';
import TagIcon from './TagIcon';

interface Props {
  item: DimItem;
  /** Optional id, otherwise will use item.index */
  id?: string;
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
  id,
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
  const itemStyles = clsx('item', {
    [styles.searchHidden]: searchHidden,
    [styles.subclassPathTop]: subclassPath?.position === 'top',
    [styles.subclassPathMiddle]: subclassPath?.position === 'middle',
    [styles.subclassPathBottom]: subclassPath?.position === 'bottom',
  });

  // Memoize the contents of the item - most of the time if this is re-rendering it's for a search, or a new item
  const contents = useMemo(() => {
    // Subclasses have limited, but customized, display. They can't be new, or tagged, or locked, etc.
    if (subclassPath) {
      return (
        <>
          <img src={subclassPath.base} className={clsx('item-img', styles.subclassBase)} alt="" />
          {subclassPath.super && (
            <BungieImage src={subclassPath.super} className={styles.subclass} alt="" />
          )}
        </>
      );
    }

    const isCapped = item.maxStackSize > 1 && item.amount === item.maxStackSize && item.uniqueStack;
    return (
      <>
        {item.percentComplete > 0 && !item.complete && (
          <div className={styles.xpBar}>
            <div className={styles.xpBarAmount} style={{ width: percent(item.percentComplete) }} />
          </div>
        )}
        <ItemIcon item={item} />
        <BadgeInfo item={item} isCapped={isCapped} uiWishListRoll={uiWishListRoll} />
        {(tag || item.locked || notes) && (
          <div className={styles.icons}>
            {item.locked && <AppIcon className={styles.icon} icon={lockIcon} />}
            {tag && <TagIcon className={styles.icon} tag={tag} />}
            {notes && <AppIcon className={styles.icon} icon={stickyNoteIcon} />}
          </div>
        )}
        {isNew && <NewItemIndicator />}
      </>
    );
  }, [isNew, item, notes, subclassPath, tag, uiWishListRoll]);

  return (
    <div
      id={id || item.index}
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
