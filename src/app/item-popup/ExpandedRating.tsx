import React from 'react';
import RatingIcon from '../inventory/RatingIcon';
import { DimItem } from '../inventory/item-types';
import { connect } from 'react-redux';
import { getRating, shouldShowRating } from '../item-review/reducer';
import { RootState } from 'app/store/types';
import { t } from 'app/i18next-t';
import { DtrRating } from '../item-review/dtr-api-types';

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
