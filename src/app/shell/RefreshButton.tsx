import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { isDragging$ } from 'app/inventory/drag-events';
import { autoRefreshEnabledSelector } from 'app/inventory/selectors';
import { useEventBusListener } from 'app/utils/hooks';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSubscription } from 'use-subscription';
import { AppIcon, refreshIcon } from './icons';
import { loadingTracker } from './loading-tracker';
import { refresh } from './refresh-events';
import styles from './RefreshButton.m.scss';

export default function RefreshButton({ className }: { className?: string }) {
  const [disabled, setDisabled] = useState(false);
  const autoRefresh = useSelector(autoRefreshEnabledSelector);

  const handleChanges = useCallback(
    () => setDisabled(!navigator.onLine || document.hidden || isDragging$.getCurrentValue()),
    []
  );
  const active = useSubscription(loadingTracker.active$);
  useEventBusListener(isDragging$, handleChanges);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleChanges);
    document.addEventListener('online', handleChanges);

    return () => {
      document.removeEventListener('visibilitychange', handleChanges);
      document.removeEventListener('online', handleChanges);
    };
  }, [handleChanges]);

  useHotkey('r', t('Hotkey.RefreshInventory'), refresh);

  return (
    <button
      type="button"
      className={clsx(styles.refreshButton, className, { disabled })}
      onClick={refresh}
      title={t('Header.Refresh') + (autoRefresh ? '\n' + t('Header.AutoRefresh') : '')}
      aria-keyshortcuts="R"
    >
      <AppIcon icon={refreshIcon} spinning={active} />
      {autoRefresh && <div className={styles.userIsPlaying} />}
    </button>
  );
}
