import React from 'react';
import { DimItem } from 'app/inventory/item-types';
import { t } from 'app/i18next-t';
import Countdown from 'app/dim-ui/Countdown';

export default function ItemExpiration({ item }: { item: DimItem }) {
  if (!item.isDestiny2()) {
    return null;
  }
  if (!item.quest || !item.quest.expirationDate) {
    return null;
  }
  const expired = item.quest.expirationDate
    ? new Date(item.quest.expirationDate).getTime() < Date.now()
    : false;
  const suppressExpiration = item.quest.suppressExpirationWhenObjectivesComplete && item.complete;

  if (suppressExpiration) {
    return null;
  }

  return (
    <div className="quest-expiration item-details">
      {expired ? (
        item.quest.expiredInActivityMessage
      ) : (
        <>
          {t('Progress.QuestExpires')} <Countdown endTime={new Date(item.quest.expirationDate)} />
        </>
      )}
    </div>
  );
}
