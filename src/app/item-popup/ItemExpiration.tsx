import Countdown from 'app/dim-ui/Countdown';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { AppIcon, faClock } from 'app/shell/icons';
import { clsx } from 'clsx';

export default function ItemExpiration({ item, compact }: { item: DimItem; compact?: boolean }) {
  if (!item.pursuit?.expirationDate) {
    return null;
  }
  const expired = item.pursuit.expirationDate
    ? item.pursuit.expirationDate.getTime() < Date.now()
    : false;
  const suppressExpiration = item.pursuit.suppressExpirationWhenObjectivesComplete && item.complete;

  if (suppressExpiration) {
    return null;
  }

  const expiresSoon = item.pursuit.expirationDate.getTime() - Date.now() < 1 * 60 * 60 * 1000;

  return (
    <div className={clsx('quest-expiration', 'item-details', { 'expires-soon': expiresSoon })}>
      {expired ? (
        compact ? (
          t('Progress.QuestExpired')
        ) : (
          item.pursuit.expiredInActivityMessage
        )
      ) : (
        <>
          <AppIcon icon={faClock} /> {!compact && t('Progress.QuestExpires')}
          <Countdown endTime={new Date(item.pursuit.expirationDate)} compact={compact} />
        </>
      )}
    </div>
  );
}
