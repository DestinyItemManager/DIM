import React from 'react';
import { AppIcon, thumbsUpIcon } from '../shell/icons';
import { t } from 'app/i18next-t';

export default function BestRatedIcon({ wishListsEnabled }: { wishListsEnabled?: boolean }) {
  const tipText = wishListsEnabled ? t('CuratedRoll.BestRatedTip') : t('DtrReview.BestRatedTip');

  return <AppIcon className="thumbs-up" icon={thumbsUpIcon} title={tipText} />;
}
