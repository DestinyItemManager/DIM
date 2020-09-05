import { settingsSelector } from 'app/settings/reducer';
import { RootState } from 'app/store/types';
import React from 'react';
import { connect } from 'react-redux';
import { getRating, ratingsSelector, shouldShowRating } from '../item-review/reducer';
import { searchFilterSelector } from '../search/search-filter';
import { inventoryWishListsSelector, wishListsEnabledSelector } from '../wishlists/reducer';
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
}

// Props from Redux via mapStateToProps
interface StoreProps {
  isNew: boolean;
  tag?: TagValue;
  notes?: boolean;
  rating?: number;
  searchHidden?: boolean;
  wishListsEnabled?: boolean;
  inventoryWishListRoll?: InventoryWishListRoll;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  const { item } = props;

  const settings = settingsSelector(state);
  const dtrRating = $featureFlags.reviewsEnabled
    ? getRating(item, ratingsSelector(state))
    : undefined;
  const showRating = $featureFlags.reviewsEnabled && shouldShowRating(dtrRating);
  const itemInfos = itemInfosSelector(state);
  const itemHashTags = itemHashTagsSelector(state);

  return {
    isNew: settings.showNewItems ? state.inventory.newItems.has(item.id) : false,
    tag: getTag(item, itemInfos, itemHashTags),
    notes: getNotes(item, itemInfos, itemHashTags) ? true : false,
    rating: dtrRating && showRating ? dtrRating.overallScore : undefined,
    searchHidden: props.allowFilter && !searchFilterSelector(state)(item),
    wishListsEnabled: wishListsEnabledSelector(state),
    inventoryWishListRoll: inventoryWishListsSelector(state)[item.id],
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
  rating,
  onClick,
  onShiftClick,
  onDoubleClick,
  searchHidden,
  inventoryWishListRoll,
  wishListsEnabled,
  ignoreSelectedPerks,
  innerRef,
}: Props) {
  return (
    <InventoryItem
      item={item}
      isNew={isNew}
      tag={tag}
      notes={notes}
      rating={rating}
      onClick={onClick}
      onShiftClick={onShiftClick}
      onDoubleClick={onDoubleClick}
      searchHidden={searchHidden}
      wishListsEnabled={wishListsEnabled}
      inventoryWishListRoll={inventoryWishListRoll}
      ignoreSelectedPerks={ignoreSelectedPerks}
      innerRef={innerRef}
    />
  );
}

export default connect<StoreProps>(mapStateToProps)(ConnectedInventoryItem);
