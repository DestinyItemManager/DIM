import * as React from 'react';
import './ItemRender.scss';
import classNames from 'classnames';

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
          <i className={classNames('fa', rating >= 4 ? 'fa-thumbs-up' : '')} />
        </div>
      );
    } else {
      return null;
    }
  }
}
