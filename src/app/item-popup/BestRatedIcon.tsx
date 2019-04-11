import React from 'react';
import { AppIcon, thumbsUpIcon } from '../shell/icons';
import { t } from 'app/i18next-t';

export default function BestRatedIcon({ curationEnabled }: { curationEnabled?: boolean }) {
  const tipText = curationEnabled ? t('CuratedRoll.BestRatedTip') : t('DtrReview.BestRatedTip');

  return <AppIcon className="thumbs-up" icon={thumbsUpIcon} title={tipText} />;
}
