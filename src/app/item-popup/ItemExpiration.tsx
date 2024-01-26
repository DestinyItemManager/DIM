import Countdown from 'app/dim-ui/Countdown';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { AppIcon, faClock } from 'app/shell/icons';
import clsx from 'clsx';

export default function ItemExpiration({ item, compact }: { item: DimItem; compact?: boolean }) {
  const expiration = item.pursuit?.expiration;
  if (!expiration) {
    return null;
  }
  const expired = expiration.expirationDate.getTime() < Date.now();
  const suppressExpiration = expiration.suppressExpirationWhenObjectivesComplete && item.complete;

  if (suppressExpiration) {
    return null;
  }

  const expiresSoon = expiration.expirationDate.getTime() - Date.now() < 1 * 60 * 60 * 1000;

  return (
    <div className={clsx('quest-expiration', 'item-details', { 'expires-soon': expiresSoon })}>
      {expired ? (
        compact ? (
          t('Progress.QuestExpired')
        ) : (
          expiration.expiredInActivityMessage
        )
      ) : (
        <>
          <AppIcon icon={faClock} /> {!compact && t('Progress.QuestExpires')}
          <Countdown endTime={expiration.expirationDate} compact={compact} />
        </>
      )}
    </div>
  );
}
