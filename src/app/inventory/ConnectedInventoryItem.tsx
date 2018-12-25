import * as React from 'react';
import { DimItem } from './item-types';
import { TagValue, getTag } from './dim-item-info';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import InventoryItem from './InventoryItem';
import { getRating, shouldShowRating } from '../item-review/reducer';
import { searchFilterSelector } from '../search/search-filters';
import { InventoryCuratedRoll } from '../curated-rolls/curatedRollService';

// Props provided from parents
interface ProvidedProps {
  item: DimItem;
  allowFilter?: boolean;
  onClick?(e): void;
  onDoubleClick?(e): void;
}

// Props from Redux via mapStateToProps
interface StoreProps {
  isNew: boolean;
  tag?: TagValue;
  rating?: number;
  hideRating?: boolean;
  searchHidden?: boolean;
  curationEnabled?: boolean;
  inventoryCuratedRoll?: InventoryCuratedRoll;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  const { item } = props;

  const settings = state.settings;

  const dtrRating = getRating(item, state.reviews.ratings);
  const showRating = shouldShowRating(dtrRating);

  return {
    isNew: settings.showNewItems ? state.inventory.newItems.has(item.id) : false,
    tag: getTag(item, state.inventory.itemInfos),
    rating: dtrRating ? dtrRating.overallScore : undefined,
    hideRating: !showRating,
    searchHidden: props.allowFilter && !searchFilterSelector(state)(item),
    curationEnabled: state.curations.curationEnabled,
    inventoryCuratedRoll: state.curations.curations[item.id]
  };
}

type Props = ProvidedProps & StoreProps;

/**
 * An item that can load its auxiliary state directly from Redux. Not suitable
 * for showing a ton of items, but useful!
 */
class ConnectedInventoryItem extends React.Component<Props> {
  render() {
    const {
      item,
      isNew,
      tag,
      rating,
      hideRating,
      onClick,
      onDoubleClick,
      searchHidden,
      inventoryCuratedRoll,
      curationEnabled
    } = this.props;

    return (
      <InventoryItem
        item={item}
        isNew={isNew}
        tag={tag}
        rating={rating}
        hideRating={hideRating}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        searchHidden={searchHidden}
        curationEnabled={curationEnabled}
        inventoryCuratedRoll={inventoryCuratedRoll}
      />
    );
  }
}

export default connect<StoreProps>(mapStateToProps)(ConnectedInventoryItem);
