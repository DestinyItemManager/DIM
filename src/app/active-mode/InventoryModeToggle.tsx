import styles from 'app/active-mode/InventoryModeToggle.m.scss';
import CheckButton from 'app/dim-ui/CheckButton';
import { t } from 'app/i18next-t';
import { useSetSetting } from 'app/settings/hooks';
import React from 'react';

export default function InventoryModeToggle({ mode }: { mode: boolean }) {
  const setSetting = useSetSetting();

  return (
    <CheckButton
      name="active-mode"
      className={styles.inventoryToggle}
      checked={mode}
      onChange={(checked) => setSetting('activeMode', checked)}
    >
      {t(`ActiveMode.ButtonOn`)}
      <div className={styles.beta}>{t(`ActiveMode.Beta`)}</div>
    </CheckButton>
  );
}
