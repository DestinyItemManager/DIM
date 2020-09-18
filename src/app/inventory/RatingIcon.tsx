import { UiWishListRoll } from 'app/wishlists/wishlists';
import React from 'react';
import { AppIcon, thumbsDownIcon, thumbsUpIcon } from '../shell/icons';
import './RatingIcon.scss';

export default function RatingIcon({ uiWishListRoll }: { uiWishListRoll: UiWishListRoll }) {
  if (uiWishListRoll === UiWishListRoll.Bad) {
    return <AppIcon className="trashlist rating-icon" icon={thumbsDownIcon} />;
  }

  return <AppIcon className="godroll rating-icon" icon={thumbsUpIcon} />;
}
