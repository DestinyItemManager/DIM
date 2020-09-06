import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { AppIcon, starIcon, starOutlineIcon } from '../icons';
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
