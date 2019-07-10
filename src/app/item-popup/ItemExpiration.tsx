import React from 'react';
import { DimItem } from 'app/inventory/item-types';
import { t } from 'app/i18next-t';
import Countdown from 'app/dim-ui/Countdown';
import { AppIcon } from 'app/shell/icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';

export default function ItemExpiration({ item, compact }: { item: DimItem; compact?: boolean }) {
  if (!item.isDestiny2()) {
    return null;
  }
  if (!item.quest || !item.quest.expirationDate) {
    return null;
  }
  const expired = item.quest.expirationDate
    ? item.quest.expirationDate.getTime() < Date.now()
    : false;
  const suppressExpiration = item.quest.suppressExpirationWhenObjectivesComplete && item.complete;

  if (suppressExpiration) {
    return null;
  }

  return (
    <div className="quest-expiration item-details">
      {expired ? (
        compact ? (
          t('Progress.QuestExpired')
        ) : (
          item.quest.expiredInActivityMessage
        )
      ) : (
        <>
          {compact ? <AppIcon icon={faClock} /> : t('Progress.QuestExpires')}{' '}
          <Countdown endTime={new Date(item.quest.expirationDate)} compact={compact} />
        </>
      )}
    </div>
  );
}
