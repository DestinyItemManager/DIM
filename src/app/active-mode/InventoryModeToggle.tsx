import styles from 'app/active-mode/InventoryModeToggle.m.scss';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import React from 'react';

export default function InventoryModeToggle({
  mode,
  onClick,
}: {
  mode: boolean;
  onClick: (mode: boolean) => void;
}) {
  return (
    <div className={clsx(`dim-button`, styles.inventoryToggle, { [styles.alt]: mode })}>
      <input
        id="inventory-toggle"
        type="checkbox"
        onClick={(event) => {
          onClick(event.currentTarget.checked);
        }}
      />
      <label htmlFor="inventory-toggle">
        {mode ? t(`ActiveMode.ButtonOn`) : t(`ActiveMode.ButtonOff`)}{' '}
        <div className={styles.beta}>{t(`ActiveMode.Beta`)}</div>
      </label>
    </div>
  );
}
