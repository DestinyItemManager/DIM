import * as React from 'react';
import { dtrRatingColor } from '../shell/dimAngularFilters.filter';
import './ItemRender.scss';

interface Props {
  rating?: number;
  hideRating?: boolean;
}

export default class ItemRender extends React.Component<Props> {
  render() {
    const { rating, hideRating } = this.props;

    if (rating !== undefined && !hideRating) {
      return (
        <div className="review-score">
          {rating}
          <i className="fa fa-star" style={dtrRatingColor(rating)} />
        </div>
      );
    } else {
      return null;
    }
  }
}
