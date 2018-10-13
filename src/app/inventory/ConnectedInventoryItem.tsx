import * as React from 'react';
import { DimItem } from './item-types';
import './dimStoreBucket.scss';
import { InventoryState } from './reducer';
import { ReviewsState } from '../item-review/reducer';
import { TagValue } from './dim-item-info';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import { D1RatingData } from '../item-review/d1-dtr-api-types';
import { D2RatingData } from '../item-review/d2-dtr-api-types';
import InventoryItem from './InventoryItem';

// Props provided from parents
interface ProvidedProps {
  item: DimItem;
  onClick?(e): void;
}

// Props from Redux via mapStateToProps
interface StoreProps {
  isNew: boolean;
  tag?: TagValue;
  rating?: number;
  hideRating?: boolean;
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
    hideRating: !showRating
  };
}

type Props = ProvidedProps & StoreProps;

/**
 * An item that can load its auxiliary state directly from Redux. Not suitable
 * for showing a ton of items, but useful!
 */
class ConnectedInventoryItem extends React.Component<Props> {
  render() {
    const { item, isNew, tag, rating, hideRating, onClick } = this.props;

    return (
      <InventoryItem
        item={item}
        isNew={isNew}
        tag={tag}
        rating={rating}
        hideRating={hideRating}
        onClick={onClick}
      />
    );
  }
}

function getTag(item: DimItem, itemInfos: InventoryState['itemInfos']): TagValue | undefined {
  const itemKey = `${item.hash}-${item.id}`;
  return itemInfos[itemKey] && itemInfos[itemKey].tag;
}

function getRating(
  item: DimItem,
  ratings: ReviewsState['ratings']
): D2RatingData | D1RatingData | undefined {
  const roll = item.isDestiny1() ? (item.talentGrid ? item.talentGrid.dtrRoll : null) : 'fixed'; // TODO: implement random rolls
  const itemKey = `${item.hash}-${roll}`;
  return ratings[itemKey] && ratings[itemKey];
}

export default connect<StoreProps>(mapStateToProps)(ConnectedInventoryItem);
