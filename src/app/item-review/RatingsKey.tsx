import React from 'react';
import RatingIcon from '../inventory/RatingIcon';
import './RatingsKey.scss';

export default function RatingsKey() {
  return (
    <div className="ratings-key">
      <span>
        <RatingIcon rating={5} uiWishListRoll={undefined} /> 5.0
      </span>
      <span>
        <RatingIcon rating={4.9} uiWishListRoll={undefined} /> 4.7+
      </span>
      <span>
        <RatingIcon rating={4.5} uiWishListRoll={undefined} /> 4.0+
      </span>
      <span>
        <RatingIcon rating={1} uiWishListRoll={undefined} /> &lt; 4.0
      </span>
    </div>
  );
}
