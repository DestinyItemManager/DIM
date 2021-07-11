import { settingsSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { searchFilterSelector } from '../search/search-filter';
import { wishListSelector } from '../wishlists/selectors';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import { getNotes, getTag, TagValue } from './dim-item-info';
import InventoryItem from './InventoryItem';
import { DimItem } from './item-types';
import { itemHashTagsSelector, itemInfosSelector } from './selectors';

// Props provided from parents
interface ProvidedProps {
  item: DimItem;
  allowFilter?: boolean;
  ignoreSelectedPerks?: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
  onClick?(e: React.MouseEvent): void;
  onShiftClick?(e: React.MouseEvent): void;
  onDoubleClick?(e: React.MouseEvent): void;
  dimArchived?: boolean;
}

// Props from Redux via mapStateToProps
interface StoreProps {
  isNew: boolean;
  tag?: TagValue;
  notes?: boolean;
  wishlistRoll?: InventoryWishListRoll;
  searchHidden?: boolean;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  const { item, dimArchived } = props;
  const settings = settingsSelector(state);
  const itemInfos = itemInfosSelector(state);
  const itemHashTags = itemHashTagsSelector(state);
  const tag = getTag(item, itemInfos, itemHashTags);
  const currentFilter = searchFilterSelector(state);
  const defaultFilterActive = currentFilter === _.stubTrue;

  return {
    isNew: settings.showNewItems ? state.inventory.newItems.has(item.id) : false,
    tag,
    notes: getNotes(item, itemInfos, itemHashTags) ? true : false,
    wishlistRoll: wishListSelector(item)(state),
    searchHidden:
      props.allowFilter && // dim this item if there's no search filter and it's archived
      ((dimArchived && defaultFilterActive && tag === 'archive') ||
        // or if there is filtering and it doesn't meet the condition
        !currentFilter(item)),
  };
}

type Props = ProvidedProps & StoreProps;

/**
 * An item that can load its auxiliary state directly from Redux. Not suitable
 * for showing a ton of items, but useful!
 */
function ConnectedInventoryItem({
  item,
  isNew,
  tag,
  notes,
  wishlistRoll,
  onClick,
  onShiftClick,
  onDoubleClick,
  searchHidden,
  ignoreSelectedPerks,
  innerRef,
}: Props) {
  return (
    <InventoryItem
      item={item}
      isNew={isNew}
      tag={tag}
      notes={notes}
      wishlistRoll={wishlistRoll}
      onClick={onClick}
      onShiftClick={onShiftClick}
      onDoubleClick={onDoubleClick}
      searchHidden={searchHidden}
      ignoreSelectedPerks={ignoreSelectedPerks}
      innerRef={innerRef}
    />
  );
}

export default connect<StoreProps>(mapStateToProps)(ConnectedInventoryItem);
