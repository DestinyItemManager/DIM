import * as React from 'react';
import { AppIcon, starIcon, starOutlineIcon } from '../icons';
import * as _ from 'lodash';
import classNames from 'classnames';
import './star-rating.scss';

export function StarRatingDisplay({ rating }: { rating: number }) {
  rating = Math.floor(rating);
  return (
    <span>
      {_.times(5, (index) => (
        <AppIcon
          key={index}
          icon={index + 1 >= rating ? starIcon : starOutlineIcon}
          className={classNames({ filled: index + 1 >= rating })}
        />
      ))}
    </span>
  );
}
