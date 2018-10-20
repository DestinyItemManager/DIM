import * as React from 'react';
import './ItemRender.scss';
import { AppIcon, thumbsUpIcon } from '../shell/icons';

interface Props {
  rating?: number;
  hideRating?: boolean;
}

export default class ItemRender extends React.Component<Props> {
  render() {
    const { rating, hideRating } = this.props;

    if (rating !== undefined && !hideRating) {
      return (
        <div className="review-score" title={rating.toLocaleString()}>
          {rating >= 4 && <AppIcon icon={thumbsUpIcon} />}
        </div>
      );
    } else {
      return null;
    }
  }
}
