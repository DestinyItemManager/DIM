import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { setItemLockState } from 'app/inventory/item-move-service';
import { ThunkDispatchProp } from 'app/store/types';
import clsx from 'clsx';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { DimItem } from '../inventory/item-types';
import { AppIcon, lockIcon, trackedIcon, unlockedIcon, unTrackedIcon } from '../shell/icons';
import styles from './LockButton.m.scss';

interface Props {
  item: DimItem;
  type: 'lock' | 'track';
  children?: React.ReactNode;
  className?: string;
}

export default function LockButton({ type, item, className, children }: Props) {
  const [locking, setLocking] = useState(false);
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();

  const lockUnlock = async () => {
    if (locking) {
      return;
    }

    setLocking(true);

    let state = false;
    if (type === 'lock') {
      state = !item.locked;
    } else if (type === 'track') {
      state = !item.tracked;
    }

    try {
      await dispatch(setItemLockState(item, state, type));
    } finally {
      setLocking(false);
    }
  };

  useHotkey('l', t('Hotkey.LockUnlock'), lockUnlock);

  const title = lockButtonTitle(item, type);

  const icon =
    type === 'lock'
      ? item.locked
        ? lockIcon
        : unlockedIcon
      : item.tracked
      ? trackedIcon
      : unTrackedIcon;

  const iconElem = <AppIcon className={clsx({ [styles.inProgress]: locking })} icon={icon} />;

  return (
    <div onClick={lockUnlock} title={title} className={className}>
      {children ? (
        <>
          {iconElem} {children}
        </>
      ) : (
        iconElem
      )}
    </div>
  );
}

export function lockButtonTitle(item: DimItem, type: 'lock' | 'track') {
  const data = { itemType: item.typeName };
  return (
    (type === 'lock'
      ? !item.locked
        ? t('MovePopup.LockUnlock.Lock', data)
        : t('MovePopup.LockUnlock.Unlock', data)
      : !item.tracked
      ? t('MovePopup.TrackUntrack.Track', data)
      : t('MovePopup.TrackUntrack.Untrack', data)) + ' [L]'
  );
}
