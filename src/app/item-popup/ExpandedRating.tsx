import * as React from 'react';
import RatingIcon from '../inventory/RatingIcon';
import { DimItem } from '../inventory/item-types';
import { D2RatingData } from '../item-review/d2-dtr-api-types';
import { D1RatingData } from '../item-review/d1-dtr-api-types';
import { connect } from 'react-redux';
import { getRating, shouldShowRating } from '../item-review/reducer';
import { RootState } from '../store/reducers';
import { t } from 'i18next';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  dtrRating: D2RatingData | D1RatingData | undefined;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return {
    dtrRating: getRating(props.item, state.reviews.ratings)
  };
}

type Props = ProvidedProps & StoreProps;

function ExpandedRating({ dtrRating }: Props) {
  if (!dtrRating || !shouldShowRating(dtrRating)) {
    return null;
  }
  return (
    <div className="item-review-average">
      <RatingIcon rating={dtrRating.overallScore} />{' '}
      {t('DtrReview.AverageRating', {
        itemRating: dtrRating.overallScore.toFixed(1),
        numRatings: dtrRating.ratingCount || 0
      })}
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(ExpandedRating);
