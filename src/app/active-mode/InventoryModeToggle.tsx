import styles from 'app/active-mode/InventoryModeToggle.m.scss';
import { t } from 'app/i18next-t';
import { setSetting } from 'app/settings/actions';
import clsx from 'clsx';
import React from 'react';
import { useDispatch } from 'react-redux';

export default function InventoryModeToggle({ mode }: { mode: boolean }) {
  const dispatch = useDispatch();

  return (
    <div
      className={clsx(`dim-button`, styles.inventoryToggle, { [styles.alt]: mode })}
      onClick={() => {
        dispatch(setSetting('activeMode', !mode));
      }}
    >
      {mode ? t(`ActiveMode.ButtonOn`) : t(`ActiveMode.ButtonOff`)}{' '}
      <div className={styles.beta}>{t(`ActiveMode.Beta`)}</div>
    </div>
  );
}
