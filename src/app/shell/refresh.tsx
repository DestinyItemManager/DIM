import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { isDragging, isDragging$ } from 'app/inventory/DraggableInventoryItem';
import { useEventBusListener } from 'app/utils/hooks';
import { EventBus } from 'app/utils/observable';
import clsx from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import { useSubscription } from 'use-subscription';
import { AppIcon, refreshIcon } from './icons';
import { loadingTracker } from './loading-tracker';

export const refresh$ = new EventBus<undefined>();

export function refresh(e?) {
  // Individual pages should listen to this event and decide what to refresh,
  // and their services should decide how to cache/dedup refreshes.
  // This event should *NOT* be listened to by services!
  if (e) {
    e.preventDefault();
  }
  refresh$.next(undefined);
}

export default function Refresh() {
  const [disabled, setDisabled] = useState(false);

  const handleChanges = useCallback(
    () => setDisabled(!navigator.onLine || document.hidden || isDragging),
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
      className={clsx('link menuItem', { disabled })}
      onClick={refresh}
      title={t('Header.Refresh')}
      role="button"
    >
      <AppIcon icon={refreshIcon} spinning={active} />
    </a>
  );
}
