import * as React from 'react';
import { dtrRatingColor } from '../dimAngularFilters.filter';
import AppIcon from './AppIcon';
import { starIcon } from './Library';

export const RatingIcon = ({ rating }: { rating: number }) => (
  <AppIcon icon={starIcon} style={dtrRatingColor(rating)} />
);
