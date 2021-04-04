import styles from 'app/active-mode/InventoryModeToggle.m.scss';
import CheckButton from 'app/dim-ui/CheckButton';
import { t } from 'app/i18next-t';
import { setSetting } from 'app/settings/actions';
import React from 'react';
import { useDispatch } from 'react-redux';

export default function InventoryModeToggle({ mode }: { mode: boolean }) {
  const dispatch = useDispatch();

  return (
    <CheckButton
      name="active-mode"
      className={styles.inventoryToggle}
      checked={mode}
      onChange={(checked) => dispatch(setSetting('activeMode', checked))}
    >
      {t(`ActiveMode.ButtonOn`)}
      <div className={styles.beta}>{t(`ActiveMode.Beta`)}</div>
    </CheckButton>
  );
}
