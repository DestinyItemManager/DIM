import { t } from 'app/i18next-t';
import { RootState } from 'app/store/types';
import React from 'react';
import { connect } from 'react-redux';
import { DimItem } from '../inventory/item-types';
import RatingIcon from '../inventory/RatingIcon';
import { DtrRating } from '../item-review/dtr-api-types';
import { getRating, shouldShowRating } from '../item-review/reducer';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  dtrRating: DtrRating | undefined;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return {
    dtrRating: getRating(props.item, state.reviews.ratings),
  };
}

type Props = ProvidedProps & StoreProps;

function ExpandedRating({ dtrRating }: Props) {
  if (!dtrRating || !shouldShowRating(dtrRating)) {
    return null;
  }
  return (
    <div className="item-review-average">
      <RatingIcon rating={dtrRating.overallScore} uiWishListRoll={undefined} />{' '}
      {t('DtrReview.AverageRating', {
        itemRating: dtrRating.overallScore.toFixed(1),
        numRatings: dtrRating.ratingCount || 0,
      })}
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(ExpandedRating);
