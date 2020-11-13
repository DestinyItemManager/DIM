import styles from 'app/active-mode/InventoryModeToggle.m.scss';
import { t } from 'app/i18next-t';
import { setSetting } from 'app/settings/actions';
import clsx from 'clsx';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

export default function InventoryModeToggle({ mode }: { mode: boolean }) {
  const history = useHistory();
  const dispatch = useDispatch();

  return (
    <div
      className={clsx(`dim-button`, styles.inventoryToggle, { [styles.alt]: mode })}
      onClick={() => {
        history.push(`${mode ? 'active' : 'inventory'}`);
        dispatch(setSetting('activeMode', !mode));
      }}
    >
      {mode ? t(`ActiveMode.ButtonOn`) : t(`ActiveMode.ButtonOff`)}{' '}
      <div className={styles.beta}>{t(`ActiveMode.Beta`)}</div>
    </div>
  );
}
