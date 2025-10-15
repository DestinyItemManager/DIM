import { trackTriumph } from 'app/dim-api/basic-actions';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { setItemLockState } from 'app/inventory/item-move-service';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import React, { useState } from 'react';
import { DimItem } from '../inventory/item-types';
import { AppIcon, lockIcon, trackedIcon, unlockedIcon, unTrackedIcon } from '../shell/icons';
import ActionButton from './ActionButton';
import * as styles from './LockButton.m.scss';

export default function LockButton({
  type,
  item,
  disabled,
  noHotkey,
  children,
}: {
  item: DimItem;
  type: 'lock' | 'track';
  disabled?: boolean;
  noHotkey?: boolean;
  children?: React.ReactNode;
}) {
  const [locking, setLocking] = useState(false);
  const dispatch = useThunkDispatch();

  const lockUnlock = async () => {
    if (locking || disabled) {
      return;
    }

    let state = false;
    if (type === 'lock') {
      state = !item.locked;
    } else if (type === 'track') {
      state = !item.tracked;
    }

    if (item.pursuit?.recordHash) {
      dispatch(trackTriumph({ recordHash: item.pursuit.recordHash, tracked: state }));
      hideItemPopup();
      return;
    }

    setLocking(true);
    try {
      await dispatch(setItemLockState(item, state, type));
    } finally {
      setLocking(false);
    }
  };

  useHotkey('l', t('Hotkey.LockUnlock'), lockUnlock, noHotkey);

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
    <ActionButton
      onClick={lockUnlock}
      title={disabled ? t('MovePopup.LockUnlock.AutoLock') : title}
      disabled={disabled}
      hotkey="l"
      hotkeyDescription={t('Hotkey.LockUnlock')}
    >
      {children ? (
        <>
          {iconElem} {children}
        </>
      ) : (
        iconElem
      )}
    </ActionButton>
  );
}

function lockButtonTitle(item: DimItem, type: 'lock' | 'track') {
  const data = { itemType: item.typeName };
  // Let's keep these translations around?
  // t('MovePopup.FavoriteUnFavorite.Favorite', data)
  // t('MovePopup.FavoriteUnFavorite.Unfavorite', data)
  return type === 'lock'
    ? !item.locked
      ? t('MovePopup.LockUnlock.Lock', data)
      : t('MovePopup.LockUnlock.Unlock', data)
    : !item.tracked
      ? t('MovePopup.TrackUntrack.Track', data)
      : t('MovePopup.TrackUntrack.Untrack', data);
}
