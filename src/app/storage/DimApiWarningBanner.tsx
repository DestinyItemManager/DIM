import { dimSyncErrorSelector, updateQueueLengthSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { useSelector } from 'react-redux';
import styles from './DimApiWarningBanner.m.scss';

/**
 * Shows an error banner in the header whenever we're having problems talking to DIM Sync. Goes away when we reconnect.
 */
export default function DimApiWarningBanner() {
  const syncError = useSelector(dimSyncErrorSelector);
  const updateQueueLength = useSelector(updateQueueLengthSelector);

  if (!syncError) {
    return null;
  }

  return (
    <div className={styles.banner}>
      <span>
        {t('Storage.DimSyncDown')}{' '}
        {updateQueueLength > 0 && t('Storage.UpdateQueueLength', { count: updateQueueLength })}
      </span>
    </div>
  );
}
