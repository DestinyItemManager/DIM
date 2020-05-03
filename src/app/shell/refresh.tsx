import React, { useState, useCallback, useEffect } from 'react';
import { t } from 'app/i18next-t';
import { AppIcon, refreshIcon } from './icons';
import { loadingTracker } from './loading-tracker';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import { Subject } from 'rxjs';
import { useSubscription } from 'app/utils/hooks';
import clsx from 'clsx';
import { isDragging$, isDragging } from 'app/inventory/DraggableInventoryItem';

export const refresh$ = new Subject();

export function refresh(e?) {
  // Individual pages should listen to this event and decide what to refresh,
  // and their services should decide how to cache/dedup refreshes.
  // This event should *NOT* be listened to by services!
  if (e) {
    e.preventDefault();
  }
  refresh$.next();
}

export default function Refresh() {
  const [active, setActive] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const handleChanges = useCallback(
    () => setDisabled(!navigator.onLine || document.hidden || isDragging),
    []
  );
  useSubscription(useCallback(() => loadingTracker.active$.subscribe(setActive), []));
  useSubscription(useCallback(() => isDragging$.subscribe(handleChanges), [handleChanges]));

  useEffect(() => {
    document.addEventListener('visibilitychange', handleChanges);
    document.addEventListener('online', handleChanges);

    return () => {
      document.removeEventListener('visibilitychange', handleChanges);
      document.removeEventListener('online', handleChanges);
    };
  }, [handleChanges]);

  return (
    <a
      className={clsx('link menuItem', { disabled })}
      onClick={refresh}
      title={t('Header.Refresh')}
      role="button"
    >
      <GlobalHotkeys
        hotkeys={[
          {
            combo: 'r',
            description: t('Hotkey.RefreshInventory'),
            callback: refresh
          }
        ]}
      />
      <AppIcon icon={refreshIcon} spinning={active} />
    </a>
  );
}
