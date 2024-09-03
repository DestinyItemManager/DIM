import { percent } from 'app/shell/formatters';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React, { useMemo } from 'react';
import BungieImage from '../dim-ui/BungieImage';
import { AppIcon, lockIcon, stickyNoteIcon } from '../shell/icons';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import BadgeInfo, { shouldShowBadge } from './BadgeInfo';
import styles from './InventoryItem.m.scss';
import ItemIcon from './ItemIcon';
import ItemIconPlaceholder from './ItemIconPlaceholder';
import NewItemIndicator from './NewItemIndicator';
import { canSyncLockState } from './SyncTagLock';
import TagIcon from './TagIcon';
import { TagValue } from './dim-item-info';
import { DimItem } from './item-types';
import { getSubclassIconInfo } from './subclass';

interface Props {
  item: DimItem;
  /** Show this item as new? */
  isNew?: boolean;
  /** User defined tag */
  tag?: TagValue;
  /** Does this item have notes? Used to show the icon. */
  hasNotes?: boolean;
  /** Has this been hidden by a search? */
  searchHidden?: boolean;
  /** Is the setting to automatically lock tagged items on? */
  autoLockTagged: boolean;
  wishlistRoll?: InventoryWishListRoll;
  /** Hide the selected Super ability on subclasses? */
  hideSelectedSuper?: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
  /** TODO: item locked needs to be passed in */
  onClick?: (e: React.MouseEvent) => void;
  onShiftClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export default function InventoryItem({
  item,
  isNew,
  tag,
  hasNotes,
  searchHidden,
  autoLockTagged,
  wishlistRoll,
  hideSelectedSuper,
  onClick,
  onShiftClick,
  onDoubleClick,
  innerRef,
}: Props) {
  let enhancedOnClick = onClick;

  if (onShiftClick) {
    enhancedOnClick = (e: React.MouseEvent) => {
      if (e.shiftKey) {
        onShiftClick(e);
      } else if (onClick) {
        onClick(e);
      }
    };
  }

  const isSubclass = item?.destinyVersion === 2 && item.bucket.hash === BucketHashes.Subclass;
  const subclassIconInfo = isSubclass && !hideSelectedSuper ? getSubclassIconInfo(item) : null;
  const hasBadge = shouldShowBadge(item);
  const itemStyles = clsx('item', {
    [styles.searchHidden]: searchHidden,
    [styles.subclass]: isSubclass,
    [styles.hasBadge]: hasBadge,
  });
  // Subtitle for engram powerlevel vs regular item type
  const subtitle = item.destinyVersion === 2 && item.isEngram ? item.power : item.typeName;

  // Memoize the contents of the item - most of the time if this is re-rendering it's for a search, or a new item
  const contents = useMemo(() => {
    // Subclasses have limited, but customized, display. They can't be new, or tagged, or locked, etc.
    if (subclassIconInfo) {
      return (
        <>
          {subclassIconInfo.base ? (
            <img
              src={subclassIconInfo.base}
              className={clsx('item-img', styles.subclassBase)}
              alt=""
            />
          ) : (
            <ItemIcon className={styles.subclassBase} item={item} />
          )}
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
        {(tag || item.locked || hasNotes) && (
          <div className={styles.icons}>
            {item.locked && (!autoLockTagged || !tag || !canSyncLockState(item)) && (
              <AppIcon className={styles.icon} icon={lockIcon} />
            )}
            {tag && <TagIcon className={styles.icon} tag={tag} />}
            {hasNotes && <AppIcon className={styles.icon} icon={stickyNoteIcon} />}
          </div>
        )}
        {isNew && <NewItemIndicator />}
      </>
    );
  }, [isNew, item, hasNotes, subclassIconInfo, tag, wishlistRoll, autoLockTagged]);

  return (
    <div
      id={item.index}
      onClick={enhancedOnClick}
      onDoubleClick={onDoubleClick}
      title={`${item.name}\n${subtitle}`}
      className={itemStyles}
      ref={innerRef}
    >
      <ItemIconPlaceholder item={item} hasBadge={hasBadge}>
        {contents}
      </ItemIconPlaceholder>
    </div>
  );
}
