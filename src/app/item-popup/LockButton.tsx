import React, { useState } from 'react';
import { DimItem } from '../inventory/item-types';
import { t } from 'app/i18next-t';
import styles from './LockButton.m.scss';
import clsx from 'clsx';
import { lockIcon, unlockedIcon, AppIcon, trackedIcon, unTrackedIcon } from '../shell/icons';
import { setItemLockState } from 'app/inventory/item-move-service';
import { touchItem } from 'app/inventory/actions';
import { useDispatch } from 'react-redux';

interface Props {
  item: DimItem;
  type: 'lock' | 'track';
}

export default function LockButton({ type, item }: Props) {
  const [locking, setLocking] = useState(false);
  const dispatch = useDispatch();

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
      await setItemLockState(item, state, type);
      if (type === 'lock') {
        item.locked = state;
      } else if (type === 'track') {
        item.tracked = state;
      }
    } finally {
      setLocking(false);
      dispatch(touchItem(item.id));
    }
  };

  const data = { itemType: item.typeName };

  const title =
    type === 'lock'
      ? !item.locked
        ? t('MovePopup.LockUnlock.Lock', data)
        : t('MovePopup.LockUnlock.Unlock', data)
      : !item.tracked
      ? t('MovePopup.TrackUntrack.Track', data)
      : t('MovePopup.TrackUntrack.Untrack', data);

  const icon =
    type === 'lock'
      ? item.locked
        ? lockIcon
        : unlockedIcon
      : item.tracked
      ? trackedIcon
      : unTrackedIcon;

  return (
    <div onClick={lockUnlock} title={title}>
      <AppIcon className={clsx({ [styles.inProgress]: locking })} icon={icon} />
    </div>
  );
}
