import React from 'react';
import RatingIcon from '../inventory/RatingIcon';
import './RatingsKey.scss';

export default function RatingsKey() {
  return (
    <div className="ratings-key">
      <span>
        <RatingIcon rating={5} isWishListRoll={false} /> 5.0
      </span>
      <span>
        <RatingIcon rating={4.9} isWishListRoll={false} /> 4.7+
      </span>
      <span>
        <RatingIcon rating={4.5} isWishListRoll={false} /> 4.0+
      </span>
      <span>
        <RatingIcon rating={1} isWishListRoll={false} /> &lt; 4.0
      </span>
    </div>
  );
}
