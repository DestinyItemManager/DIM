import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { isDragging$ } from 'app/inventory/drag-events';
import { useEventBusListener } from 'app/utils/hooks';
import clsx from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import { useSubscription } from 'use-subscription';
import { AppIcon, refreshIcon } from './icons';
import { loadingTracker } from './loading-tracker';
import { refresh } from './refresh-events';

export default function RefreshButton({ className }: { className?: string }) {
  const [disabled, setDisabled] = useState(false);

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
    <a
      className={clsx(className, { disabled })}
      onClick={refresh}
      title={t('Header.Refresh')}
      role="button"
    >
      <AppIcon icon={refreshIcon} spinning={active} />
    </a>
  );
}
