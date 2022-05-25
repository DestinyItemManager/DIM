import { percent } from 'app/shell/formatters';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React, { useMemo } from 'react';
import BungieImage from '../dim-ui/BungieImage';
import { AppIcon, lockIcon, starIcon, stickyNoteIcon } from '../shell/icons';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import BadgeInfo from './BadgeInfo';
import { TagValue } from './dim-item-info';
import styles from './InventoryItem.m.scss';
import { DimItem } from './item-types';
import ItemIcon from './ItemIcon';
import NewItemIndicator from './NewItemIndicator';
import { getSubclassIconInfo } from './subclass';
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
  wishlistRoll?: InventoryWishListRoll;
  /** Show the selected Super ability on subclasses? */
  selectedSuperDisplay?: 'enabled' | 'disabled' | 'v3SubclassesOnly';
  innerRef?: React.Ref<HTMLDivElement>;
  /** TODO: item locked needs to be passed in */
  onClick?(e: React.MouseEvent): void;
  onShiftClick?(e: React.MouseEvent): void;
  onDoubleClick?(e: React.MouseEvent): void;
}

export default function InventoryItem({
  item,
  id,
  isNew,
  tag,
  notes,
  searchHidden,
  wishlistRoll,
  selectedSuperDisplay = 'enabled',
  onClick,
  onShiftClick,
  onDoubleClick,
  innerRef,
}: Props) {
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

  const isSubclass = item?.destinyVersion === 2 && item.bucket.hash === BucketHashes.Subclass;
  const subclassIconInfo =
    isSubclass && selectedSuperDisplay !== 'disabled'
      ? getSubclassIconInfo(item, selectedSuperDisplay === 'v3SubclassesOnly')
      : null;
  const itemStyles = clsx('item', {
    [styles.searchHidden]: searchHidden,
    [styles.subclass]: isSubclass,
    [styles.subclassPathTop]: subclassIconInfo?.path === 'top',
    [styles.subclassPathMiddle]: subclassIconInfo?.path === 'middle',
    [styles.subclassPathBottom]: subclassIconInfo?.path === 'bottom',
  });
  // Subtitle for engram powerlevel vs regular item type
  const subtitle = item.destinyVersion === 2 && item.isEngram ? item.power : item.typeName;
  // Memoize the contents of the item - most of the time if this is re-rendering it's for a search, or a new item
  const contents = useMemo(() => {
    // Subclasses have limited, but customized, display. They can't be new, or tagged, or locked, etc.
    if (subclassIconInfo) {
      return (
        <>
          <img
            src={subclassIconInfo.base}
            className={clsx('item-img', styles.subclassBase)}
            alt=""
          />
          {subclassIconInfo.super && (
            <BungieImage src={subclassIconInfo.super} className={styles.subclassSuperIcon} alt="" />
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
        <BadgeInfo item={item} isCapped={isCapped} wishlistRoll={wishlistRoll} />
        {(tag || item.locked || notes) && (
          <div className={styles.icons}>
            {item.locked && (
              <AppIcon
                className={styles.icon}
                icon={item.bucket.hash !== BucketHashes.Finishers ? lockIcon : starIcon}
              />
            )}
            {tag && <TagIcon className={styles.icon} tag={tag} />}
            {notes && <AppIcon className={styles.icon} icon={stickyNoteIcon} />}
          </div>
        )}
        {isNew && <NewItemIndicator />}
      </>
    );
  }, [isNew, item, notes, subclassIconInfo, tag, wishlistRoll]);

  return (
    <div
      id={id || item.index}
      onClick={enhancedOnClick}
      onDoubleClick={onDoubleClick}
      title={`${item.name}\n${subtitle}`}
      className={itemStyles}
      ref={innerRef}
    >
      {contents}
    </div>
  );
}
