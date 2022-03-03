import { UiWishListRoll } from 'app/wishlists/wishlists';
import React from 'react';
import { AppIcon, thumbsDownIcon, thumbsUpIcon } from '../shell/icons';
import styles from './RatingIcon.m.scss';

export default function RatingIcon({ uiWishListRoll }: { uiWishListRoll: UiWishListRoll }) {
  if (uiWishListRoll === UiWishListRoll.Bad) {
    return <AppIcon className={styles.trashlist} icon={thumbsDownIcon} />;
  }

  return <AppIcon className={styles.godroll} icon={thumbsUpIcon} />;
}
