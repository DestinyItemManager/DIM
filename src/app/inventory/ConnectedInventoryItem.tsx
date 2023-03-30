import { settingSelector } from 'app/dim-api/selectors';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { queryValidSelector, searchFilterSelector } from '../search/search-filter';
import { wishListSelector } from '../wishlists/selectors';
import InventoryItem from './InventoryItem';
import { DimItem } from './item-types';
import { hasNotesSelector, isNewSelector, tagSelector } from './selectors';

const autoLockTaggedSelector = settingSelector('autoLockTagged');

/**
 * An item that can load its auxiliary state directly from Redux. Not suitable
 * for showing a ton of items, but useful!
 */
export default function ConnectedInventoryItem({
  item,
  onClick,
  onShiftClick,
  onDoubleClick,
  hideSelectedSuper,
  dimArchived,
  allowFilter,
  innerRef,
}: {
  item: DimItem;
  allowFilter?: boolean;
  hideSelectedSuper?: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
  onClick?: (e: React.MouseEvent) => void;
  onShiftClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  dimArchived?: boolean;
}) {
  // TODO: maybe send these down via Context?
  const tag = useSelector(tagSelector(item));
  const currentFilter = useSelector(searchFilterSelector);
  const validQuery = useSelector(queryValidSelector);
  const autoLockTagged = useSelector(autoLockTaggedSelector);
  const defaultFilterActive = currentFilter === _.stubTrue;

  const isNew = useSelector(isNewSelector(item));
  const hasNotes = useSelector(hasNotesSelector(item));
  const wishlistRoll = useSelector(wishListSelector(item));
  const searchHidden =
    // dim this item if there's no search filter and it's archived
    (dimArchived && defaultFilterActive && tag === 'archive') ||
    // or if there is a valid filter and it doesn't meet the condition
    (allowFilter && validQuery && !currentFilter(item));

  return useMemo(
    () => (
      <InventoryItem
        item={item}
        isNew={isNew}
        tag={tag}
        hasNotes={hasNotes}
        wishlistRoll={wishlistRoll}
        onClick={onClick}
        onShiftClick={onShiftClick}
        onDoubleClick={onDoubleClick}
        searchHidden={searchHidden}
        hideSelectedSuper={hideSelectedSuper}
        innerRef={innerRef}
        autoLockTagged={autoLockTagged}
      />
    ),
    [
      innerRef,
      isNew,
      item,
      hasNotes,
      onClick,
      onDoubleClick,
      onShiftClick,
      searchHidden,
      hideSelectedSuper,
      tag,
      wishlistRoll,
      autoLockTagged,
    ]
  );
}
