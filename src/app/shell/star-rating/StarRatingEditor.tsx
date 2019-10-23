import React from 'react';
import { AppIcon, starIcon, starOutlineIcon } from '../icons';
import _ from 'lodash';
import clsx from 'clsx';
import './star-rating.scss';

interface Props {
  rating: number;
  onRatingChange(rating: number);
}

interface State {
  hovered: number;
}

export class StarRatingEditor extends React.Component<Props, State> {
  state: State = { hovered: 0 };

  render() {
    let { rating } = this.props;
    rating = Math.floor(rating);

    const { hovered } = this.state;

    return (
      <span className="star-editor">
        {_.times(5, (index) => (
          <a
            key={index}
            onClick={() => this.toggle(index)}
            onMouseEnter={() => this.hover(index)}
            onMouseLeave={() => this.hover(0)}
          >
            <AppIcon
              icon={index < rating ? starIcon : starOutlineIcon}
              className={clsx({ filled: index < rating, hovered: hovered >= index + 1 })}
            />
          </a>
        ))}
      </span>
    );
  }

  private hover = (hovered: number) => {
    this.setState({ hovered });
  };

  private toggle = (index: number) => {
    this.props.onRatingChange(index + 1);
  };
}
