import { t } from 'app/i18next-t';
import React from 'react';
import { AppIcon, thumbsUpIcon } from '../shell/icons';

export default function BestRatedIcon({ wishListsEnabled }: { wishListsEnabled?: boolean }) {
  const tipText = wishListsEnabled ? t('WishListRoll.BestRatedTip') : t('DtrReview.BestRatedTip');

  return <AppIcon className="thumbs-up" icon={thumbsUpIcon} title={tipText} />;
}
