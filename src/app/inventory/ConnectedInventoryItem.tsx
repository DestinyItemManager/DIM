import React from 'react';
import { DimItem } from './item-types';
import { TagValue, getTag, getNotes } from './dim-item-info';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import InventoryItem from './InventoryItem';
import { getRating, shouldShowRating, ratingsSelector } from '../item-review/reducer';
import { searchFilterSelector } from '../search/search-filters';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import { wishListsEnabledSelector, inventoryWishListsSelector } from '../wishlists/reducer';

// Props provided from parents
interface ProvidedProps {
  item: DimItem;
  allowFilter?: boolean;
  ignoreSelectedPerks?: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
  onClick?(e): void;
  onShiftClick?(e): void;
  onDoubleClick?(e): void;
}

// Props from Redux via mapStateToProps
interface StoreProps {
  isNew: boolean;
  tag?: TagValue;
  notes?: boolean;
  rating?: number;
  searchHidden?: boolean;
  curationEnabled?: boolean;
  inventoryCuratedRoll?: InventoryWishListRoll;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  const { item } = props;

  const settings = state.settings;

  const dtrRating = getRating(item, ratingsSelector(state));
  const showRating = shouldShowRating(dtrRating);

  return {
    isNew: settings.showNewItems ? state.inventory.newItems.has(item.id) : false,
    tag: getTag(item, state.inventory.itemInfos),
    notes: getNotes(item, state.inventory.itemInfos) ? true : false,
    rating: dtrRating && showRating ? dtrRating.overallScore : undefined,
    searchHidden: props.allowFilter && !searchFilterSelector(state)(item),
    curationEnabled: wishListsEnabledSelector(state),
    inventoryCuratedRoll: inventoryWishListsSelector(state)[item.id]
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
  inventoryCuratedRoll,
  curationEnabled,
  ignoreSelectedPerks,
  innerRef
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
      curationEnabled={curationEnabled}
      inventoryCuratedRoll={inventoryCuratedRoll}
      ignoreSelectedPerks={ignoreSelectedPerks}
      innerRef={innerRef}
    />
  );
}

export default connect<StoreProps>(mapStateToProps)(ConnectedInventoryItem);
