import React from 'react';
import { AppIcon, starIcon, starOutlineIcon } from '../icons';
import _ from 'lodash';
import clsx from 'clsx';
import './star-rating.scss';

export function StarRatingDisplay({ rating }: { rating: number }) {
  rating = Math.floor(rating);
  return (
    <span>
      {_.times(5, (index) => (
        <AppIcon
          key={index}
          icon={index < rating ? starIcon : starOutlineIcon}
          className={clsx({ filled: index < rating })}
        />
      ))}
    </span>
  );
}
