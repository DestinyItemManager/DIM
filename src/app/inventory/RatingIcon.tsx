import React from 'react';
import { AppIcon, starIcon, thumbsUpIcon } from '../shell/icons';
import { faCaretDown, faCaretUp, faMinus } from '@fortawesome/free-solid-svg-icons';
import './RatingIcon.scss';

export default function RatingIcon({
  rating,
  isWishListRoll
}: {
  rating: number;
  isWishListRoll: boolean;
}) {
  if (isWishListRoll) {
    return <AppIcon className="godroll rating-icon" icon={thumbsUpIcon} />;
  }

  if (rating === 5) {
    return <AppIcon className="godroll rating-icon" icon={starIcon} />;
  }

  if (rating < 4) {
    return <AppIcon className="dogroll rating-icon" icon={faCaretDown} />;
  }

  if (rating >= 4.7) {
    return <AppIcon className="goodroll rating-icon" icon={faCaretUp} />;
  }

  return <AppIcon className="mehroll rating-icon" icon={faMinus} />;
}
