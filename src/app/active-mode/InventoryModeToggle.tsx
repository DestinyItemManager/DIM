import { t } from 'app/i18next-t';
import React from 'react';

export default function InventoryModeToggle({
  mode,
  onClick,
}: {
  mode: boolean;
  onClick: (mode: boolean) => void;
}) {
  return (
    <div className={`dim-button inventory-toggle ${mode ? 'alt' : ''}`}>
      <input
        id="inventory-toggle"
        type="checkbox"
        onClick={(event) => {
          onClick(event.currentTarget.checked);
        }}
      />
      <label htmlFor="inventory-toggle">
        {mode ? t(`ActiveMode.ButtonOn`) : t(`ActiveMode.ButtonOff`)}{' '}
        <div className="beta">{t(`ActiveMode.Beta`)}</div>
      </label>
    </div>
  );
}
