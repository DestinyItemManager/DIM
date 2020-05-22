import React from 'react';
import {
  AppIcon,
  starIcon,
  thumbsUpIcon,
  thumbsDownIcon,
  faCaretDown,
  faCaretUp,
  faMinus,
} from '../shell/icons';
import './RatingIcon.scss';
import { UiWishListRoll } from 'app/wishlists/wishlists';

export default function RatingIcon({
  rating,
  uiWishListRoll,
}: {
  rating: number;
  uiWishListRoll?: UiWishListRoll;
}) {
  if (uiWishListRoll) {
    if (uiWishListRoll === UiWishListRoll.Bad) {
      return <AppIcon className="trashlist rating-icon" icon={thumbsDownIcon} />;
    }

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
