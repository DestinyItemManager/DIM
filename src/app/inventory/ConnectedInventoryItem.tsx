import * as React from 'react';
import { DimItem } from './item-types';
import './dimStoreBucket.scss';
import { InventoryState } from './reducer';
import { TagValue } from './dim-item-info';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import InventoryItem from './InventoryItem';
import { getRating } from '../item-review/reducer';
import { searchFilterSelector } from '../search/search-filters';
import { InventoryCuratedRoll } from '../curated-rolls/curatedRollService';

// Props provided from parents
interface ProvidedProps {
  item: DimItem;
  allowFilter?: boolean;
  onClick?(e): void;
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
  const showRating =
    dtrRating &&
    dtrRating.overallScore &&
    (dtrRating.ratingCount > (item.destinyVersion === 2 ? 0 : 1) ||
      dtrRating.highlightedRatingCount > 0);

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
      searchHidden,
      curationEnabled,
      inventoryCuratedRoll
    } = this.props;

    return (
      <InventoryItem
        item={item}
        isNew={isNew}
        tag={tag}
        rating={rating}
        hideRating={hideRating}
        onClick={onClick}
        searchHidden={searchHidden}
        curationEnabled={curationEnabled}
        inventoryCuratedRoll={inventoryCuratedRoll}
      />
    );
  }
}

function getTag(item: DimItem, itemInfos: InventoryState['itemInfos']): TagValue | undefined {
  const itemKey = `${item.hash}-${item.id}`;
  return itemInfos[itemKey] && itemInfos[itemKey].tag;
}

export default connect<StoreProps>(mapStateToProps)(ConnectedInventoryItem);
